import { useState } from "react";
import './App.css'
const partsData = [
  {
    partNumber: "A-06587",
    description: "Switch Assembly",
    onHand: 50,
    minimumStock: 100,
    shortage: 150,
    supplier: "ABC Components",
    currentUpdate: "vendor delayed shipment. ETA 3 days"
  },
  {
    partNumber: "B-10452",
    description: "Sensor Cable",
    onHand: 100,
    minimumStock: 80,
    shortage: 20,
    supplier: "XYZ Sensors",
    currentUpdate: "order placed. expected delivery in 5 days"
  },
  {
    partNumber: "C-77821",
    description: "Joystick Housing",
    onHand: 300,
    minimumStock: 100,
    shortage: 0,
    supplier: "Local Supplier",
    currentUpdate: "in stock. no action required"
  },
];
const criticalParts = partsData.filter(
  (part) => part.onHand < part.minimumStock
).length;
const healthyParts = partsData.filter(
  (part) => part.onHand >= part.minimumStock
).length;
const biggestShortage = partsData.reduce((maxPart, part) => {
  const currentGap = Math.max(part.minimumStock - part.onHand, 0);
  const maxGap = Math.max(maxPart.minimumStock - maxPart.onHand, 0);

  return currentGap > maxGap ? part : maxPart;
}, partsData[0]);
function App() {
const [searchTerm, setSearchTerm] = useState("");
const [filterType, setFilterType] = useState("all");
const [m1201084, setM1201084] = useState(0);
const [m115SL15F56, setM115SL15F56] = useState(0);
const [n212N133423, setN212N133423] = useState(0);
const [bomParts, setBomParts] = useState([]);
const filteredParts = partsData
  .filter((part) =>
    part.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    part.description.toLowerCase().includes(searchTerm.toLowerCase())
  )
  .filter((part) => {
    if (filterType === "critical") {
      return part.onHand < part.minimumStock;
    }

    if (filterType === "healthy") {
      return part.onHand >= part.minimumStock;
    }

    return true;
  })
  .sort(
    (a, b) =>
      Math.max(b.minimumStock - b.onHand, 0) -
      Math.max(a.minimumStock - a.onHand, 0)
  ); 
  return (
    <div className="dashboard">
      <header className="hero-section">
        <p className="eyebrow">Manufacturing Control Center</p>
        <h1>Inventory Shortage Prevention Dashboard</h1>
        <p className="subtitle">
          Helping production, inventory, and purchasing teams see part shortages
          before they delay customer orders.
        </p>
      </header>
      <section className="planning-card">
  <h2>Production Planning</h2>

  <div>
    <label>212N133-423:</label>
    <input
      type="number"
      value={n212N133423}
      onChange={(e) => setN212N133423(Number(e.target.value))}
    />
  </div>

  <div>
    <label>M115SL15F56:</label>
    <input
      type="number"
      value={m115SL15F56}
      onChange={(e) => setM115SL15F56(Number(e.target.value))}
    />
  </div>

  <div>
    <label>M120-1084:</label>
    <input
      type="number"
      value={m1201084}
      onChange={(e) => setM1201084(Number(e.target.value))}
    />
  </div>
  <button
  onClick={() => {
   setBomParts([
  {
    partNumber: "PART-001",
    description: "Spring Assembly",
    qtyPerUnit: 1,
    requiredQty: m1201084,
  },
  {
    partNumber: "PART-002",
    description: "Handle Assembly",
    qtyPerUnit: 1,
    requiredQty: m1201084,
  },
  {
    partNumber: "PART-003",
    description: "Switch Assembly",
    qtyPerUnit: 2,
    requiredQty: m1201084 * 2,
  },
  {
    partNumber: "PART-004",
    description: "Housing Assembly",
    qtyPerUnit: 1,
    requiredQty: m1201084,
  },
]);
  }}
>
  Generate Requirements
</button>
<p>Parts Loaded: {bomParts.length}</p>
<table>
  <thead>
    <tr>
      <th>Part Number</th>
      <th>Description</th>
      <th>Required Qty</th>
    </tr>
  </thead>
  <tbody>
    {bomParts.map((part) => (
      <tr key={part.partNumber}>
        <td>{part.partNumber}</td>
        <td>{part.description}</td>
        <td>{part.requiredQty}</td>
      </tr>
    ))}
  </tbody>
</table>
</section> 

      <section className="value-cards">
   <div
  className={filterType === "critical" ? "card active-card" : "card"}
  onClick={() => setFilterType("critical")}
  >
  <h3>🔴 Critical Parts</h3>
  <h2>{criticalParts}</h2>
  <p>Require immediate action</p>
</div>

<div className="card">
  <h3>🟠 At Risk Parts</h3>
  <h2>0</h2>
  <p>Monitor closely</p>
</div>

<div
  className={filterType === "healthy" ? "card active-card" : "card"}
  onClick={() => setFilterType("healthy")}
>
  <h3>🟢 Safe Parts</h3>
  <h2>{healthyParts}</h2>
  <p>No action required</p>
</div>
<div className="card">
  <h3>🚨 Biggest Shortage</h3>
  <h2>{biggestShortage.partNumber}</h2>
  <p>
    Gap: {Math.max(biggestShortage.minimumStock - biggestShortage.onHand, 0)}
  </p>
</div>
<button onClick={() => setFilterType("all")}>
  Show All Parts
</button>
      </section>

      <section className="panel">
  <h2>Critical Parts Requiring Action</h2>
  <input
  type="text"
  placeholder="Search Part Number or Description..."
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
/>

  <table>
    <thead>
      <tr>
        <th>Part</th>
        <th>Description</th>
        <th>On Hand</th>
        <th>Shortage</th>
        <th>Minimum Stock</th>
        <th>Inventory Gap</th>
        <th>Supplier</th>
        <th>Current Update</th>
        <th>Status</th>
      </tr>
    </thead>

    <tbody>
  {filteredParts.map((part) => (
    <tr
  key={part.partNumber}
  className={part.onHand < part.minimumStock ? "critical-row" : ""}
  >
      <td>{part.partNumber}</td>
      <td>{part.description}</td>
      <td>{part.onHand}</td>
<td>{part.shortage}</td>
<td>{part.minimumStock}</td>
<td>{Math.max(part.minimumStock - part.onHand, 0)}</td>
      <td>{part.supplier}</td>
      <td>{part.currentUpdate}</td>
      <td>
  <span
    className={
      part.onHand < part.minimumStock
        ? "status critical"
        : "status safe"
    }
  >
    {part.onHand < part.minimumStock
      ? "Below Minimum"
      : "Healthy"}
  </span>
</td>
    </tr>
  ))}
</tbody>
  </table>
</section>
    </div>
  );
}

export default App;