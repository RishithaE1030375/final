/*!
* Start Bootstrap - Scrolling Nav v5.0.5 (https://startbootstrap.com/template/scrolling-nav)
* Copyright 2013-2022 Start Bootstrap
* Licensed under MIT (https://github.com/StartBootstrap/startbootstrap-scrolling-nav/blob/master/LICENSE)
*/
//
// Scripts
// 

import tripdetails from "/js/trips.json" assert {type: 'json'}
window.addEventListener('DOMContentLoaded', event => {

    // Activate Bootstrap scrollspy on the main nav element
    const mainNav = document.body.querySelector('#mainNav');
    if (mainNav) {
        new bootstrap.ScrollSpy(document.body, {
            target: '#mainNav',
            offset: 74,
        });
    };

    // Collapse responsive navbar when toggler is visible
    const navbarToggler = document.body.querySelector('.navbar-toggler');
    const responsiveNavItems = [].slice.call(
        document.querySelectorAll('#navbarResponsive .nav-link')
    );
    responsiveNavItems.map(function (responsiveNavItem) {
        responsiveNavItem.addEventListener('click', () => {
            if (window.getComputedStyle(navbarToggler).display !== 'none') {
                navbarToggler.click();
            }
        });
    });

    var map = L.map('map').setView([41.1446,-8.6063], 13);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
	
	
	//fetch("http://localhost:8000/js/trips.json").then((tripsdetails) => tripsdetails.json()).then((json) => {L.geoJSON(json).addTo(map)} );
	//console.log(tripdetails);
	var geoJsonLayer = L.geoJSON(tripdetails);
	geoJsonLayer.addTo(map);
	//geoJsonLayer.addData(tripdetails);
	
	const tripMap = new Map();
	Object.entries(tripdetails.features).forEach(([key,value]) => {Object.entries(value).forEach(([k,v]) => {if(k == "properties") {
		Object.entries(v).forEach(([k1,v1]) => {if(k1 == "taxiid"){ if(tripMap.has(v1)){var tempArray = tripMap.get(v1); tempArray.push(v); tripMap.set(v1,tempArray)} else {tripMap.set(v1,new Array(v))}}})
	}})});	
	
	var data = [];
	tripMap.forEach((k,v)=> {data.push(new Map([['TaxiId', v], ['NoOfTrips', k.length]]))});
		
	//console.log(data);
	
	var barData = [];
	
	data.forEach(e => barData.push(Object.fromEntries(e)));
	//console.log(barData);
	
	
	var svg = d3.select("#svgContainer").append("svg").attr("width", 4500).attr("height", 400); 

	var svg = d3.select("#svgContainer").select("svg"), margin = 150, width = svg.attr("width") - margin, height = svg.attr("height") - margin; 
	
	var xScale = d3.scaleBand().range([0, width]).padding(0.5); 
	
	var yScale = d3.scaleLinear().range([height, 0]); 
	
	var g = svg.append("g").attr("transform", "translate(" + 100 + "," + 100 + ")"); 
	
	xScale.domain(barData.map(d => {return d.TaxiId;}));
	
	yScale.domain([0,d3.max(barData, function (d) { return d.NoOfTrips;})],) ;
		
	g.append("g").attr("transform", "translate(0," + height + ")").call(d3.axisBottom(xScale)).selectAll("text").attr("y","20")
		.style("writing-mode","vertical-lr");
	
	g.append("g").call(d3.axisLeft(yScale)) .append("text").attr("transform", "rotate(-90)") 
		.attr("x", -40) 
		.attr("y", 50) 
		.attr("dy", "-5.1em") 
		.attr("text-anchor", "end") 
		.attr("stroke", "black") 
		.attr("font-size", "15px") 
		.text("No of Trips");  ;
	
	svg.append("text") 
		.attr("transform", "translate(100,0)") 
		.attr("x", 700) 
		.attr("y", 50) 
		.attr("font-size", "20px") 
		.text("Number of Trips by a Taxi"); 
		
	svg.append("text") 
		.attr("transform", "translate(100,0)") 
		.attr("x", 0) 
		.attr("y", 450) 
		.attr("dy", "-5.1em") 
		.attr("text-anchor", "end") 
		.attr("stroke", "black") 
		.attr("font-size", "15px") 
		.text("Taxi Id");
	
	g.selectAll(".bar")
         .data(barData)
         .enter().append("rect")
         .attr("class", "bar")
		 .on("click",onMouseClick)
         .attr("x", function(d) { return xScale(d.TaxiId); })
         .attr("y", function(d) { return yScale(d.NoOfTrips); })
         .attr("width", xScale.bandwidth())
         .attr("height", function(d) { return height - yScale(d.NoOfTrips); })
		 .attr("fill","#3333ef");
		 
	
	function onMouseClick(d, i) {
		
		var latestJson = [];
		Object.entries(tripdetails.features).forEach(([key,value]) => {Object.entries(value).forEach(([k,v]) => {if(k == "properties") {
		Object.entries(v).forEach(([k1,v1]) => {if(k1 == "taxiid" && v1 == i.TaxiId){latestJson.push(value)}})}})});
		var latestData = Object.fromEntries(new Map([['type','FeatureCollection'],['features',latestJson]]));
		map.removeLayer(geoJsonLayer);
		geoJsonLayer = L.geoJson(latestData);
		geoJsonLayer.addTo(map);
		
		createPieChart(i.TaxiId);
	}
	
	function createPieChart(data) {
		var pieData = tripMap.get(data);
		d3.select("#pieChart").select("svg").remove();
		var svg = d3.select("#pieChart").append("svg").attr("width", 300).attr("height", 300),
			width = svg.attr("width"),
			height = svg.attr("height"),
			radius = 100;
			
		var tooltip = d3.select('#pieChart').append('div').attr('class', 'pieTooltip');
		tooltip.append('div').attr('class','tripId');
		tooltip.append('div').attr('class','duration');
		
			
		var g = svg.append("g").attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
		
		var ordScale = d3.scaleOrdinal().domain(pieData)
            .range(['#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe', '#008080', '#e6beff', '#9a6324', '#fffac8', '#800000', '#aaffc3', '#808000', '#ffd8b1', '#000075', '#808080']);
		
		
		var pie = d3.pie().value(function(d) { 
                return d.duration; 
            });;
		
		var arc = g.selectAll("arc").data(pie(pieData)).enter().append("g").attr("class","arc");
		
		var path = d3.arc().outerRadius(radius).innerRadius(0);

        arc.append("path").attr("d", path).attr("fill", function(d, i) { return ordScale(d.data.tripid); });
		
		arc.on('mouseover',function(d,i) {
			tooltip.select('.tripId').html("Trip ID: " + i.data.tripid);
			tooltip.select('.duration').html("Duration: " + i.data.duration +"s");
			tooltip.style('display','block');
		});
		
		arc.on('mouseout',function(){tooltip.style('display','none')})
		
		arc.on('mousemove', function(d) { // when mouse moves   
			tooltip.style('top', (d.layerY + 10) + 'px') // always 10px below the cursor
			.style('left', (d.layerX + 10) + 'px') // always 10px to the right of the mouse
		});
		
		svg.append("g")
               .attr("transform", "translate(" + (width / 2 - 120) + "," + 20 + ")")
               .append("text")
               .text("Trip Details By Taxi ID: " + data)
               .attr("class", "title")
	}

});
