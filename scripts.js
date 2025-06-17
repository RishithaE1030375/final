window.addEventListener("DOMContentLoaded", async () => {
  const map = L.map("map").setView([41.15, -8.61], 13);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  const response = await fetch("js/trips.json");
  const tripData = await response.json();

  L.geoJSON(tripData).addTo(map);

  const tripsByTaxi = d3.rollups(tripData.features, v => v.length, d => d.properties.taxiid);

  const width = 1200, height = 300;
  const svg = d3.select("#svgContainer").append("svg")
    .attr("width", width)
    .attr("height", height);

  const x = d3.scaleBand()
    .domain(tripsByTaxi.map(d => d[0]))
    .range([50, width - 10])
    .padding(0.1);

  const y = d3.scaleLinear()
    .domain([0, d3.max(tripsByTaxi, d => d[1])])
    .range([height - 30, 10]);

  svg.selectAll(".bar")
    .data(tripsByTaxi)
    .join("rect")
    .attr("class", "bar")
    .attr("x", d => x(d[0]))
    .attr("y", d => y(d[1]))
    .attr("width", x.bandwidth())
    .attr("height", d => height - 30 - y(d[1]))
    .attr("fill", "steelblue")
    .on("click", (event, d) => drawPieChart(d[0], tripData.features));

  svg.append("g")
    .attr("transform", `translate(0,${height - 30})`)
    .call(d3.axisBottom(x).tickValues(x.domain().filter((d, i) => i % 20 === 0)))
    .selectAll("text")
    .attr("transform", "rotate(45)")
    .style("text-anchor", "start");

  svg.append("g")
    .attr("transform", "translate(50,0)")
    .call(d3.axisLeft(y));

  function drawPieChart(taxiid, data) {
    const pieSvg = d3.select("#pieChart").html("").append("svg")
      .attr("width", 400)
      .attr("height", 400);

    const trips = data.filter(d => d.properties.taxiid === taxiid);
    const pieData = trips.map(d => ({
      label: `Trip ID: ${d.properties.tripid}`,
      value: d.properties.duration || 1
    }));

    const radius = 200;
    const pie = d3.pie().value(d => d.value);
    const arc = d3.arc().innerRadius(0).outerRadius(radius - 20);
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const g = pieSvg.append("g")
      .attr("transform", `translate(${radius},${radius})`);

    const arcs = g.selectAll(".arc")
      .data(pie(pieData))
      .enter().append("g")
      .attr("class", "arc");

    arcs.append("path")
      .attr("d", arc)
      .attr("fill", (d, i) => color(i))
      .append("title")
      .text(d => `${d.data.label}\nDuration: ${d.data.value}s`);

    pieSvg.append("text")
      .attr("x", 200)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .text(`Trip Details By Taxi ID: ${taxiid}`);
  }
});