import postcss from 'postcss';

const VIRTUAL_STYLE_PREFIX = '\0virtual:pelusogroup-styles/';

const featureForClass = (className) => {
  if (className === 'admin-header-link' || className === 'site-shell') return null;
  // The PIN challenge can be opened before the user reaches an admin route.
  if (/^admin-pin-/.test(className)) return null;
  if (/^(admin-analytics|admin-site-traffic|admin-traffic|analytics|chart|metric)(-|$)/.test(className)) return 'analytics';
  if (/^admin-/.test(className)) return 'admin';
  if (/^(account|customer-request|customer-purchase|customer-sale|my-account)(-|$)/.test(className)) return 'account';
  if (/^(catalog|inventory|filter|results-count|search-field|empty-results)(-|$)/.test(className)) return 'catalog';
  if (/^(vehicle-sale|sell|dedicated-sell-page)(-|$)/.test(className)) return 'sell';
  if (/^(vehicle-detail|vehicle-spec)(-|$)/.test(className)) return 'vehicle-detail';
  if (/^(rental|rent)(-|$)/.test(className)) return 'rental';
  if (/^(contact|location|cookie-map)(-|$)/.test(className)) return 'contact';
  if (/^(home|hero|popular-brand|popular-brands|sold-car|sold-cars|delivery-story|services|service|about|team-card)(-|$)/.test(className)) return 'home';
  if (/^vehicle-/.test(className)) return 'vehicle';
  return null;
};

const featureForRule = (rule) => {
  const selectors = postcss.list.comma(rule.selector);
  if (selectors.length === 0) return null;

  // Keep rules spanning multiple feature groups shared to preserve their selector scope.
  const groups = selectors.map((selector) => {
    const classes = selector.match(/\.([_a-zA-Z][\w-]*)/g) || [];
    const features = new Set(classes
      .map((className) => featureForClass(className.slice(1)))
      .filter(Boolean));
    if (features.has('analytics')) return 'analytics';
    return features.size === 1 ? [...features][0] : null;
  });

  return groups[0] && groups.every((group) => group === groups[0]) ? groups[0] : null;
};

const appendRule = (root, ancestors, rule) => {
  let destination = root;
  ancestors.forEach(({ name, params }) => {
    const wrapper = postcss.atRule({ name, params });
    destination.append(wrapper);
    destination = wrapper;
  });
  destination.append(rule.clone());
};

const splitStyles = (source, id, styleChunks) => {
  const root = postcss.parse(source, { from: id });
  const chunks = new Map();

  const moveScopedRules = (container, ancestors = []) => {
    container.nodes?.slice().forEach((node) => {
      if (node.type === 'rule') {
        const feature = featureForRule(node);
        if (!feature) return;
        if (!chunks.has(feature)) chunks.set(feature, postcss.root());
        appendRule(chunks.get(feature), ancestors, node);
        node.remove();
        return;
      }

      if (node.type === 'atrule' && node.nodes) {
        moveScopedRules(node, [...ancestors, node]);
      }
    });
  };

  moveScopedRules(root);
  styleChunks.clear();
  chunks.forEach((chunk, feature) => styleChunks.set(feature, chunk.toString()));

  return { code: root.toString(), map: null };
};

export default function routeStyleSplitter() {
  const styleChunks = new Map();
  let sourceCssId = null;

  return {
    name: 'pelusogroup-route-style-splitter',
    enforce: 'pre',
    transform(source, id) {
      const normalizedId = id.split('?')[0].replace(/\\/g, '/');
      if (!normalizedId.endsWith('/src/index.css')) return null;

      sourceCssId = id;
      return splitStyles(source, id, styleChunks);
    },
    async handleHotUpdate({ file, read, server, modules }) {
      const normalizedFile = file.replace(/\\/g, '/');
      if (!normalizedFile.endsWith('/src/index.css')) return null;

      const affectedFeatures = new Set(styleChunks.keys());
      const source = await read();
      sourceCssId = file;
      splitStyles(source, file, styleChunks);
      styleChunks.forEach((_css, feature) => affectedFeatures.add(feature));

      const updatedModules = new Set(modules);
      affectedFeatures.forEach((feature) => {
        const module = server.moduleGraph.getModuleById(`${VIRTUAL_STYLE_PREFIX}${feature}.css`);
        if (!module) return;
        server.moduleGraph.invalidateModule(module);
        updatedModules.add(module);
      });

      return [...updatedModules];
    },
    resolveId(source) {
      if (!source.startsWith('virtual:pelusogroup-styles/')) return null;
      return `${VIRTUAL_STYLE_PREFIX}${source.slice('virtual:pelusogroup-styles/'.length)}`;
    },
    load(id) {
      if (!id.startsWith(VIRTUAL_STYLE_PREFIX)) return null;
      if (sourceCssId) this.addWatchFile(sourceCssId);
      const feature = id.slice(VIRTUAL_STYLE_PREFIX.length).replace(/\.css$/, '');
      return {
        code: styleChunks.get(feature) || '',
        map: null,
        moduleSideEffects: true,
      };
    },
  };
}
