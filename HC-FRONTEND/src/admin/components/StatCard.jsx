function StatCard({ title, value }) {
  return (
    <div className="stat-card">
      <h2 className="stat-title">{title}</h2>
      <h2 className="stat-value">{value}</h2>
    </div>
  );
}

export default StatCard;
