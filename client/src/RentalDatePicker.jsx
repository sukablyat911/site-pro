import { DayPicker } from 'react-day-picker';
import { it } from 'react-day-picker/locale';
import 'react-day-picker/style.css';

export default function RentalDatePicker(props) {
  return <DayPicker {...props} locale={it} />;
}
