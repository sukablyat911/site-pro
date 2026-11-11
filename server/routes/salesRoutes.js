const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const { getAuthenticatedUser, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const salesCollection = () => mongoose.connection.collection('vehicle_sales');

async function requireCustomer(req, res, next) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: 'Accedi per continuare.' });
    if (user.role !== 'user') return res.status(403).json({ error: 'Questa funzione è riservata agli account cliente.' });
    req.user = user;
    return next();
  } catch (error) {
    console.error('Customer authorization failed:', error);
    return res.status(500).json({ error: 'Non è stato possibile verificare il tuo account.' });
  }
}

function publicSale(sale, includeTerms = false, includeMetrics = false) {
  const views = Number.isSafeInteger(sale.engagement?.views)
    ? sale.engagement.views
    : Number.isSafeInteger(sale.dailyViews) ? sale.dailyViews : null;
  const purchaseRequests = Number.isSafeInteger(sale.engagement?.purchaseRequests)
    ? sale.engagement.purchaseRequests
    : null;
  return {
    id: sale._id.toString(),
    make: sale.vehicle.make,
    model: sale.vehicle.model,
    year: sale.vehicle.year,
    bodyType: sale.vehicle.bodyType || '',
    images: sale.vehicle.images,
    soldAt: sale.soldAt,
    ...(includeTerms ? {
      price: sale.vehicle.price,
      vatMode: sale.vehicle.vatMode || 'inclusive',
      installmentPlan: sale.vehicle.installmentPlan || null,
    } : {}),
    ...(includeMetrics ? {
      finalPrice: Number.isFinite(sale.finalPrice) ? sale.finalPrice : null,
      views,
      purchaseRequests,
      metricsComplete: Number.isSafeInteger(views) && Number.isSafeInteger(purchaseRequests),
    } : {}),
  };
}

async function ensureSalesIndexes() {
  await salesCollection().createIndex({ vehicleId: 1 }, { unique: true });
  await salesCollection().createIndex({ soldAt: -1 });
  await salesCollection().createIndex({ buyerId: 1, soldAt: -1 });
}

router.get('/', async (_req, res) => {
  try {
    const sales = await salesCollection().find({}, {
      projection: { vehicle: 1, soldAt: 1 },
    }).sort({ soldAt: -1 }).toArray();
    return res.json({ sales: sales.map(publicSale) });
  } catch (error) {
    console.error('Could not load vehicle sales:', error);
    return res.status(500).json({ error: 'Non è stato possibile caricare le auto vendute.' });
  }
});

router.get('/reviews', async (_req, res) => {
  try {
    const sales = await salesCollection().find({ 'review.createdAt': { $exists: true } }, {
      projection: { vehicle: 1, review: 1 },
    }).sort({ 'review.createdAt': -1 }).toArray();
    return res.json({
      reviews: sales.map((sale) => ({
        id: sale._id.toString(),
        make: sale.vehicle.make,
        model: sale.vehicle.model,
        year: sale.vehicle.year,
        image: sale.vehicle.images?.[0] || '',
        rating: sale.review.rating,
        text: sale.review.text,
        authorName: sale.review.authorName,
        createdAt: sale.review.createdAt,
      })),
    });
  } catch (error) {
    console.error('Could not load customer reviews:', error);
    return res.status(500).json({ error: 'Non è stato possibile caricare le recensioni.' });
  }
});

router.get('/mine', requireCustomer, async (req, res) => {
  try {
    const sales = await salesCollection().find({ buyerId: req.user._id }, {
      projection: { vehicle: 1, soldAt: 1, review: 1 },
    }).sort({ soldAt: -1 }).toArray();
    return res.json({
      sales: sales.map((sale) => ({
        ...publicSale(sale, true),
        review: sale.review ? {
          rating: sale.review.rating,
          text: sale.review.text,
          createdAt: sale.review.createdAt,
        } : null,
      })),
    });
  } catch (error) {
    console.error('Could not load customer purchases:', error);
    return res.status(500).json({ error: 'Non è stato possibile caricare i tuoi acquisti.' });
  }
});

router.get('/admin/customers', requireAdmin, async (_req, res) => {
  try {
    const customers = await User.find({ role: 'user' }).select('name email').sort({ name: 1 }).lean();
    return res.json({
      customers: customers.map((customer) => ({
        id: customer._id.toString(),
        name: customer.name,
        email: customer.email,
      })),
    });
  } catch (error) {
    console.error('Could not load customer accounts for vehicle sales:', error);
    return res.status(500).json({ error: 'Non è stato possibile caricare gli account cliente.' });
  }
});

router.get('/admin', requireAdmin, async (_req, res) => {
  try {
    const sales = await salesCollection().find({}).sort({ soldAt: -1 }).toArray();
    const dailyViews = sales.length
      ? await mongoose.connection.collection('vehicle_daily_metrics')
        .aggregate([
          { $match: { vehicleId: { $in: sales.map((sale) => sale.vehicleId) } } },
          { $group: { _id: '$vehicleId', views: { $sum: '$views' } } },
        ])
        .toArray()
      : [];
    const dailyViewsByVehicle = new Map(dailyViews.map(({ _id, views }) => [_id, views]));
    const buyers = await User.find({ _id: { $in: sales.map((sale) => sale.buyerId) } })
      .select('name email').lean();
    const buyersById = new Map(buyers.map((buyer) => [buyer._id.toString(), buyer]));
    return res.json({
      sales: sales.map((sale) => {
        const saleWithDailyViews = {
          ...sale,
          dailyViews: dailyViewsByVehicle.get(sale.vehicleId),
        };
        return {
          ...publicSale(saleWithDailyViews, true, true),
          buyer: buyersById.has(sale.buyerId.toString())
            ? {
              name: buyersById.get(sale.buyerId.toString()).name,
              email: buyersById.get(sale.buyerId.toString()).email,
            }
            : null,
          review: sale.review ? {
            rating: sale.review.rating,
            text: sale.review.text,
            createdAt: sale.review.createdAt,
          } : null,
        };
      }),
    });
  } catch (error) {
    console.error('Could not load admin vehicle sales:', error);
    return res.status(500).json({ error: 'Non è stato possibile caricare lo storico vendite.' });
  }
});

router.post('/', requireAdmin, async (req, res) => {
  const vehicleId = typeof req.body?.vehicleId === 'string' ? req.body.vehicleId.trim() : '';
  const buyerId = typeof req.body?.buyerId === 'string' ? req.body.buyerId.trim() : '';
  const finalPrice = Number(req.body?.finalPrice);
  if (!vehicleId || !mongoose.isValidObjectId(buyerId)) {
    return res.status(400).json({ error: 'Seleziona un’auto e un account cliente validi.' });
  }
  if (!Number.isFinite(finalPrice) || finalPrice <= 0 || finalPrice > 100000000) {
    return res.status(400).json({ error: 'Inserisci un prezzo finale di vendita valido.' });
  }

  try {
    const buyer = await User.findOne({ _id: buyerId, role: 'user' }).select('name email');
    if (!buyer) return res.status(404).json({ error: 'L’account cliente selezionato non è disponibile.' });

    const session = await mongoose.startSession();
    const collection = salesCollection();
    let sale;
    try {
      await session.withTransaction(async () => {
        const vehicle = await mongoose.connection.collection('vehicles').findOne(
          { id: vehicleId, type: 'buy' },
          { session },
        );
        if (!vehicle) {
          const error = new Error('L’auto non è disponibile nell’inventario.');
          error.statusCode = 404;
          throw error;
        }

        const requestRecords = await mongoose.connection.collection('vehicle_purchase_requests')
          .find({ vehicleId }, { session, projection: { createdAt: 1, metricsRecorded: 1 } })
          .toArray();
        const dailyMetrics = await mongoose.connection.collection('vehicle_daily_metrics')
          .find({ vehicleId }, { session, projection: { day: 1, views: 1, requests: 1 } })
          .toArray();
        const requestsByDay = new Map();
        dailyMetrics.forEach(({ day, requests }) => {
          if (typeof day !== 'string') return;
          requestsByDay.set(day, (requestsByDay.get(day) || 0) + (Number.isSafeInteger(requests) ? requests : 0));
        });
        requestRecords.filter((request) => request.metricsRecorded !== true).forEach(({ createdAt }) => {
          if (!(createdAt instanceof Date) || Number.isNaN(createdAt.getTime())) return;
          const day = createdAt.toISOString().slice(0, 10);
          requestsByDay.set(day, (requestsByDay.get(day) || 0) + 1);
        });
        const dailyViews = dailyMetrics.reduce((total, metric) => (
          total + (Number.isSafeInteger(metric.views) ? metric.views : 0)
        ), 0);
        const dailyRequests = dailyMetrics.reduce((total, metric) => (
          total + (Number.isSafeInteger(metric.requests) ? metric.requests : 0)
        ), 0);
        const untrackedRequests = requestRecords.filter((request) => request.metricsRecorded !== true).length;
        const record = {
          vehicleId,
          buyerId: buyer._id,
          vehicle: {
            id: vehicle.id,
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            bodyType: vehicle.bodyType || '',
            images: vehicle.images,
            price: vehicle.price,
            vatMode: vehicle.vatMode || 'inclusive',
            installmentPlan: vehicle.installmentPlan || null,
          },
          engagement: {
            views: Math.max(Number.isSafeInteger(vehicle.viewCount) ? vehicle.viewCount : 0, dailyViews),
            purchaseRequests: Math.max(
              Number.isSafeInteger(vehicle.purchaseRequestCount) ? vehicle.purchaseRequestCount : 0,
              requestRecords.length,
              dailyRequests + untrackedRequests,
            ),
            requestTimeline: [...requestsByDay].map(([day, requests]) => ({ day, requests })),
          },
          finalPrice,
          soldAt: new Date(),
          createdAt: new Date(),
        };
        const result = await collection.insertOne(record, { session });
        const removal = await mongoose.connection.collection('vehicles').deleteOne(
          { id: vehicleId, type: 'buy' },
          { session },
        );
        if (removal.deletedCount !== 1) {
          const error = new Error('L’auto è stata modificata da un’altra operazione. Aggiorna la pagina e riprova.');
          error.statusCode = 409;
          throw error;
        }
        await mongoose.connection.collection('vehicle_purchase_requests').deleteMany(
          { vehicleId },
          { session },
        );
        sale = { ...record, _id: result.insertedId };
      });
    } catch (error) {
      if (error.statusCode === 404 || error.statusCode === 409) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      throw error;
    } finally {
      await session.endSession();
    }

    return res.status(201).json({
      sale: {
        ...publicSale(sale, true, true),
        buyer: { name: buyer.name, email: buyer.email },
        review: null,
      },
    });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ error: 'Questa auto risulta già venduta.' });
    console.error('Could not mark vehicle as sold:', error);
    return res.status(500).json({ error: 'Non è stato possibile registrare la vendita.' });
  }
});

router.post('/:saleId/review', requireCustomer, async (req, res) => {
  const { saleId } = req.params;
  const rating = Number(req.body?.rating);
  const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
  if (!mongoose.isValidObjectId(saleId)
      || !Number.isInteger(rating) || rating < 1 || rating > 5
      || text.length < 10 || text.length > 500
      || req.body?.publishName !== true) {
    return res.status(400).json({ error: 'Inserisci una valutazione da 1 a 5, un commento da 10 a 500 caratteri e il consenso a mostrare il tuo nome.' });
  }

  try {
    const collection = salesCollection();
    const sale = await collection.findOne({
      _id: new mongoose.Types.ObjectId(saleId),
      buyerId: req.user._id,
    });
    if (!sale) return res.status(404).json({ error: 'Non risulta un acquisto associato al tuo account.' });
    if (sale.review) return res.status(409).json({ error: 'Hai già lasciato una recensione per questa auto.' });

    const review = {
      rating,
      text,
      authorName: req.user.name.trim().split(/\s+/)[0],
      createdAt: new Date(),
    };
    const update = await collection.updateOne(
      { _id: sale._id, buyerId: req.user._id, review: { $exists: false } },
      { $set: { review } },
    );
    if (update.modifiedCount !== 1) {
      return res.status(409).json({ error: 'Hai già lasciato una recensione per questa auto.' });
    }
    return res.status(201).json({ review });
  } catch (error) {
    console.error('Could not save customer review:', error);
    return res.status(500).json({ error: 'Non è stato possibile pubblicare la recensione.' });
  }
});

module.exports = { router, ensureSalesIndexes };
