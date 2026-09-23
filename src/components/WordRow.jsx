import { GAME_SETTING } from '../constants';
import { v4 as uuid } from 'uuid';

export default function WordRow({ guess, setting }) {
  const word = guess?.word ?? '';
  const result = guess?.result ?? [];

  const letters = Array.from(
    { length: GAME_SETTING[setting] },
    (_, index) => word[index] ?? '',
  );

  return (
    <div className={`word-row ${setting}`}>
      {letters.map((letter, index) => (
        <span style={{ background: result[index] ?? 'white' }} key={uuid}>
          {letter}
        </span>
      ))}
    </div>
  );
}
