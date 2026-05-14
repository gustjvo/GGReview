import './StarRating.css';

export default function StarRating({ value, onChange, max = 10, readOnly = false }) {
  const stars = Array.from({ length: max }, (_, i) => i + 1);

  return (
    <div className={`star-rating ${readOnly ? 'readonly' : ''}`}>
      {stars.map((s) => (
        <button
          key={s} type="button"
          className={`star ${s <= value ? 'filled' : ''}`}
          onClick={() => !readOnly && onChange && onChange(s)}
          disabled={readOnly}
          title={`${s}/10`}
        >
          {s <= value ? '★' : '☆'}
        </button>
      ))}
      {value > 0 && <span className="star-value">{value}/10</span>}
    </div>
  );
}
