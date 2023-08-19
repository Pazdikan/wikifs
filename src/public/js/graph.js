const svg = d3.select("#graph");
const width = +svg.attr("width");
const height = +svg.attr("height");

// Extract all entry names from the entries object
const entryNames = Object.keys(entries);

// Center the nodes at the SVG's center
const centerX = window.innerWidth <= 768 ? width / 2 : width;
const centerY = height / 1.5;

// Create nodes array from entry names
const nodes = entryNames.map((name) => ({ id: name, x: centerX, y: centerY }));

// Create links array based on entries
const links = [];
for (const source in entries) {
  for (const target of entries[source].meta.backlinks) {
    links.push({ source, target });
  }
}

const data = {
  nodes,
  links,
};

const simulation = d3
  .forceSimulation(data.nodes)
  .force(
    "link",
    d3
      .forceLink(data.links)
      .id((d) => d.id)
      .distance(25)
  )
  .force("charge", d3.forceManyBody().strength(-50))
  .force("center", d3.forceCenter(centerX, centerY));

const contentGroup = svg.append("g");

const link = contentGroup
  .append("g")
  .selectAll("line")
  .data(data.links)
  .enter()
  .append("line")
  .attr("stroke", "#999")
  .attr("stroke-opacity", 0.6);

const nodeGroup = contentGroup
  .append("g")
  .selectAll("g")
  .data(data.nodes)
  .enter()
  .append("g")
  .call(drag(simulation))
  .attr("class", "node-group");

nodeGroup.append("circle").attr("r", 5).attr("fill", "blue");

// Create tooltips using Tippy.js
nodeGroup.each(function (d) {
  tippy(this, {
    content: d.id,
    arrow: true,
  });
});

// Initialize the zoom behavior
const zoom = d3.zoom().on("zoom", (event) => {
  contentGroup.attr("transform", event.transform);
  simulation.alpha(0.3).restart(); // Restart the simulation when zooming
});

// Apply the zoom behavior to the SVG
svg.call(zoom);

simulation.on("tick", () => {
  link
    .attr("x1", (d) => d.source.x)
    .attr("y1", (d) => d.source.y)
    .attr("x2", (d) => d.target.x)
    .attr("y2", (d) => d.target.y);

  nodeGroup.attr("transform", (d) => `translate(${d.x},${d.y})`);
});

function drag(sim) {
  function dragstarted(event) {
    if (!event.active) sim.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  }

  function dragged(event) {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  }

  function dragended(event) {
    if (!event.active) sim.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
  }

  return d3
    .drag()
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended);
}
