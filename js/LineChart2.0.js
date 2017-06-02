////////////////////////////////////////////////////////////////////////////
/////////////////////init smallmultiple linechart //////////////////////////
var LCwidth = document.getElementById('region_linechart').clientWidth;
var LCheight = 200;

var LCmargin = {
    top: 15,
    bottom: 18,
    left: 30,
    right: 20
};

LCwidth = LCwidth/3 - LCmargin.left - LCmargin.right;
LCheight = LCheight - LCmargin.top - LCmargin.bottom;

var LCtooltip = d3.select('body')
    .append('div')
    .attr('class', 'tooltip');

var LNtooltip = d3.select('body')
    .append('div')
    .attr('class', 'tooltip');

var parseTime = d3.timeParse("%Y");
var timeFormat = d3.timeFormat('%Y');
var formatAsPercentage = d3.format(".1%");

var LCxScale = d3.scaleTime()
    .range([0, LCwidth]);

var LCyScale = d3.scaleLinear()
    .range([LCheight, 0]);

var LCcolorScale = d3.scaleOrdinal()
    .range(["#e41a1c","#43a2ca","#008837","#984ea3","#ff7f00","#253494","#a65628","#f259ab","#525252","#000000"]);

var LCline = d3.line()
    .x(function(d){ return LCxScale(d.Year);})
    .y(function(d){ return LCyScale(d.Service);})
    //.curve(d3.curveBasis);

var LCx_axis = d3.axisBottom()
    .scale(LCxScale)
    .tickFormat(d3.timeFormat("%y"));

var LCy_axis = d3.axisLeft()
    .scale(LCyScale)
    .tickFormat(d3.format(".0%"));

////////////////////////////////////////////////////////////////////////////
//////////////////////////   init active legend  ///////////////////////////

var LGwidth = document.getElementById('legend_area').clientWidth;
var LGheight = 20;

var LGmargin = {
    top: 0,
    bottom: 0,
    left: 5,
    right: 5
};

LGwidth = LGwidth/3 - LGmargin.left - LGmargin.right;
LGheight = LGheight - LGmargin.top - LGmargin.bottom;

////////////////////////////////////////////////////////////////////////////////////////
///////////////////  draw smallmultiple linechart for regions  /////////////////////////
var RegionNameByRegionId = {};
d3.csv("data/ShareOfService_region.csv", type, function(error, csv_data) {
        if (error) throw error;

        LCxScale.domain(d3.extent(csv_data, function(d) { return d.Year; }));
        LCyScale.domain(d3.extent(csv_data, function(d){ return d.Service;}));


        csv_data.forEach(function(d) { 
          RegionNameByRegionId [d.Region_id] = d.Region
        });

        nested_data = d3.nest()
          .key(function(d) { return d.Gender;})
          .key(function(d) { return d.Region_id})
          //.sortKeys(d3.ascending)
          .entries(csv_data);

        var region_data = d3.nest().key(function(d) { return d.Region}).entries(csv_data);
        var region_keys = region_data.map(function(d) { return d.key;});

        var LCsvg = d3.select('#region_linechart')
            .selectAll("svg")
            .data(nested_data)
            .enter()
            .append('svg')
            .attr("class","smallmultiple")
            .attr('width', (LCwidth + LCmargin.left + LCmargin.right))
            .attr('height', (LCheight + LCmargin.top + LCmargin.bottom));

        var LCg = LCsvg.append('g')
                .attr('transform', 'translate(' + LCmargin.left + ',' + LCmargin.top + ')');

        var regionLines = LCg.selectAll(".region")
          .data(function(d) {return d.values})
          .enter().append("g")
          .attr("class", "region");

        regionLines
          .append("path")
          .attr("class", "line_region")
          .attr("id", function(d) { return ("tag_region_"+ d.key); })
          .attr("d", function(d) { return LCline(d.values);})
          .style("stroke", function(d) { return LCcolorScale(d.key); })
          .attr('fill', 'none');
          //.attr("opacity", 0.2);

        var points = regionLines
          .append("g")
          .attr("class", "points")
          .selectAll('.point')
          .data(function(d) { return d.values});

        points
          .enter()
          .append('circle')
          .attr('class', 'point')
          .attr('r', 6)
          .attr('cx', function(d){ return LCxScale(d.Year);})
          .attr('cy', function(d){ return LCyScale(d.Service);})
          .attr('fill', "black")
          .attr('opacity', 0)
          .on("mouseover",LCmouseOver)
          .on("mousemove",LCmouseMove)
          .on("mouseout",LCmouseOut);

        LCg.append("g")
          .attr("class", "axis")
          .attr("transform", "translate(0," + LCheight + ")")
          .call(LCx_axis)
          .selectAll("text")  
          .style("text-anchor", "end");

        LCg.append("g")
          .attr("class", "axis")
          .call(LCy_axis);

        LCg.append("g")
          .attr("class", "label")
          .attr("transform", "translate(" + LCxScale(parseTime(2012)) + ",0)")
          .call(LCy_axis);

        LCg.append("g")
          .attr("class", "topic")
          .append("text")
          .attr("transform", "translate(0," + (-LCmargin.top/3) + ")")
          .attr("font-size", 13)
          //.attr("font-weight", "bold")
          .text(function(d){ return d.key});

        function LCmouseOver(d){
          d3.selectAll("path.line_region")
              .transition()
              .duration(500)
              .style("opacity",0.1)
              .style("stroke-width",1);

          d3.selectAll("#tag_region_"+ d.Region_id)
              .transition()
              .style("opacity",1)
              .style("stroke-width",3);

          d3.select(this)
            .transition()
            .style('opacity', 0.8)
            .attr('fill', LCcolorScale(RegionNameByRegionId[d.Region_id]));

          LCtooltip
              .style("display", null)
              .html( "<p> Region: " + d.Region + "<br> Year: " + timeFormat(d.Year) + "<br> Share: " + formatAsPercentage(d.Service) +"</p>");
          };

        function LCmouseMove(d){
            LCtooltip
                .style("top", (d3.event.pageY + 10) + "px")
                .style("left", (d3.event.pageX - 10) + "px");
        };

        function LCmouseOut(d){
            d3.selectAll("path.line_region")
                .transition()
                .duration(500)
                .style("opacity",1)
                .style("stroke-width",1);
            LCtooltip
                .style("display", "none");

            d3.select(this)
              .transition()
              .style('opacity', 0);

        };
});

function type(d) {
d.Year = parseTime(d.Year);
d.Service = +d.Service/100;
return d;
};
////////////////////////////////////////////////////////////////////////////////////////
///////////////////// finish draw smallmultiple line  for regions //////////////////////




///////////////////  draw smallmultiple linechart for countries ////////////////////////
d3.csv("data/ShareOfService_country.csv", type, function(error, csv_data) {
        if (error) throw error;

  LCxScale.domain(d3.extent(csv_data, function(d) { return d.Year; }));
  LCyScale.domain(d3.extent(csv_data, function(d){ return d.Service;}));

  var RegionIdByRegion = {};
  var RegionNameByRegionId = {};
  var RegionNameByCountryId = {};
  var CountryNameByCountryId = {};
  var RegionIdByCountryId = {};

  csv_data.forEach(function(d) { 
    RegionNameByCountryId [d.Country_id] = d.Region
    RegionIdByCountryId [d.Country_id] = d.Region_id
    CountryNameByCountryId [d.Country_id] = d.Country
    RegionIdByRegion [d.Region] = d.Region_id
    RegionNameByRegionId [d.Region_id] = d.Region
  });

  /////////////acqurie Keys of regions/////////////////////////
  var region_data = d3.nest()
    .key(function(d) { return d.Region_id; })
    .sortKeys(d3.ascending)
    .entries(csv_data);

  region_keys = region_data.map(function(d) { return RegionNameByRegionId[d.key];})//       

  /////////////set color domain according to regions/////////
  LCcolorScale.domain(region_keys);

  /////////////////  transforming data //////////////////////
  nested_data = d3.nest()
    .key(function(d) { return d.Gender;})
    .key(function(d) { return d.Country_id})
    .entries(csv_data);

  /////////////////  draw line chart //////////////
  /////////////////  draw  smallmultiple linechart ///////////
  var LNsvg = d3.select('#country_linechart')
      .selectAll("svg")
      .data(nested_data)
      .enter()
      .append('svg')
      .attr("class","linechart")
      .attr('width', (LCwidth + LCmargin.left + LCmargin.right))
      .attr('height', (LCheight + LCmargin.top + LCmargin.bottom))

  var LNg = LNsvg.append('g')
          .attr('transform', 'translate(' + LCmargin.left + ',' + LCmargin.top + ')');

  var countryLines = LNg.selectAll(".country_line")
    .data(function(d) {return d.values})
    .enter().append("g")
    .attr("class", "country");

  countryLines
    .append("path")
    .attr("class", function(d) {return ("line_region_"+ RegionIdByCountryId[d.key]); })
    .attr("id", function(d) {return ("tag_country_"+ d.key); })
    .attr("d", function(d) { return LCline(d.values);})
    .style("stroke", function(d) { return LCcolorScale(RegionNameByCountryId[d.key]); })
    .attr('fill', 'none')
    .attr("opacity", 0.1)
    .on("mouseover",LNmouseOver)
    .on("mousemove",LNmouseMove)
    .on("mouseout",LNmouseOut);

  /////////////////  draw  axis //////////////
  LNg.append("g")
    .attr("class", "axis")
    .attr("transform", "translate(0," + LCheight + ")")
    .call(LCx_axis)
    .selectAll("text")  
    .style("text-anchor", "end");

  LNg.append("g")
    .attr("class", "axis")
    .call(LCy_axis)

  LNg.append("g")
    .attr("class", "label")
    .attr("transform", "translate(" + LCxScale(parseTime(2012)) + ",0)")
    .call(LCy_axis);

  ///////////////// append name fo chart //////////////
  LNg.append("g")
    .attr("class", "topic")
    .append("text")
    .attr("transform", "translate(0," + (-LCmargin.top/3) + ")")
    .attr("font-size", 13)
    //.attr("font-weight", "bold")
    .text(function(d){ return d.key});


  function LNmouseOver(d){

    d3.selectAll("#tag_country_"+ d.key)
        .transition()
        .duration(100)
        .style("opacity",1)
        .style("stroke-width", 2);


    LNtooltip
        .style("display", null)
        .html( "<p> Country: " + CountryNameByCountryId[d.key] + "<br> Region: " + RegionNameByCountryId[d.key] +" </p>");
    };

  function LNmouseMove(d){
      LNtooltip
          .style("top", (d3.event.pageY + 10) + "px")
          .style("left", (d3.event.pageX - 10) + "px");
  };

  function LNmouseOut(d){
      d3.selectAll("g.country").selectAll("path")
          .transition()
          .duration(100)
          .style("opacity",0.1)
          .style("stroke-width",1);
      LNtooltip
          .style("display", "none");
  };

  //////////////////////////////////////////////////////////
  /////////////////  draw div of legend ////////////////////
  var LGlegend = d3.select('#legend_area')
      .selectAll("svg")
      .data(region_keys)
      .enter()
      .append("svg")
      //.attr('class','legendtext')
      .attr("height", LGheight+LGmargin.top+LGmargin.bottom)
      .attr("width", LGwidth+LGmargin.left+LGmargin.right)
      .append('g')
      .append('text')
      .attr('x','50%')
      .attr('y','80%')
      //.attr('y', 15)
      .attr('class','legend_tag')
      .attr('fill',LCcolorScale)
      .attr('font-size','13px')
      .attr('font-weight','bold')
      .attr('text-anchor','middle')
      .text(function(d) { return d })
      .on("mouseover", LGmouseover)
      .on("mouseout", LGmouseout);

      /////////////////  mouseover event for legend  //////////////
      function LGmouseover(d) {
        //console.log(d)
        d3.selectAll("g.country").selectAll("path")
          .transition()
          .duration(500)
          .style("opacity",0.1);
        d3.selectAll("path.line_region_"+RegionIdByRegion[d])
          .transition()
          .duration(500)
          .style("opacity",1)
          .style("stroke-width", 2);

        d3.selectAll("g.region").selectAll("path")
          .transition()
          .duration(500)
          .style("opacity",0.1);
        d3.selectAll("#tag_region_"+RegionIdByRegion[d])
          .transition()
          .duration(500)
          .style("opacity",1)
          .style("stroke-width", 2);

        d3.select(this)
          .transition()
          .duration(500)
          .style("font-size", "18px" );
      };

      function LGmouseout(d){
        d3.selectAll("g.country").selectAll("path")
          .transition()
          .duration(500)
          .style("opacity",0.1)
          .style("stroke-width",1);
        d3.selectAll("g.region").selectAll("path")
          .transition()
          .duration(500)
          .style("opacity",1)
          .style("stroke-width",1);
        d3.select(this)
          .transition()
          .duration(500)
          .style("font-size", "13px" );
      };

      // //http://bl.ocks.org/jessicafreaner/8fb0ac6c12aa1dab5f70
      // var active_legend = [];
      // function LGclick(d) {
      //   // console.log(active_legend);
      //   index = active_legend.indexOf(d);
      //   // console.log(active_legend.indexOf(d));
      //   if (index > -1) {
      //     active_legend.splice(index,1);
      //     d3.selectAll("path.line_region_"+RegionIdByRegion[d])
      //       .transition()
      //       .duration(50)
      //       .style("opacity",0.1)
      //       .style("stroke-width", 1);
      //     d3.select(this)
      //       .style("font-size", "13px");
      //   } else {
      //     // not active previously
      //     active_legend.push(d);
      //     d3.selectAll("path.line_region_"+RegionIdByRegion[d])
      //       .transition()
      //       .duration(50)
      //       .style("opacity",1)
      //       .style("stroke-width", 2);
      //     d3.select(this)
      //       .style("font-size", "18px");
      //   }
      // }
});

////////////////////////////////////////////////////////////////////////////
///////////////////// finish draw smallmultiple line ///////////////////////