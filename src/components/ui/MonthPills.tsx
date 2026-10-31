/** Horizontal month selector. */
export const MonthPills = ({
  months,
  selected,
  onSelect,
}: {
  months: string[];
  selected: string;
  onSelect: (month: string) => void;
}) => (
  <div className="month-pills">
    {months.map((month) => (
      <button
        key={month}
        className={month === selected ? "active" : ""}
        onClick={() => onSelect(month)}
      >
        {month.slice(0, 3)}
      </button>
    ))}
  </div>
);
