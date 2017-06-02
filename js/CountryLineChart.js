////////////////////////////////////////////////////////////////////////////
/////////////////////init smallmultiple line ///////////////////////////////
var LNwidth = document.getElementById('country_linechart').clientWidth;
var LNheight = 200;

var LNmargin = {
    top: 15,
    bottom: 18,
    left: 40,
    right: 20
};

LNwidth = LNwidth/3 - LNmargin.left - LNmargin.right;
LNheight = LNheight - LNmargin.top - LNmargin.bottom;

var LNtooltip = d3.select('body')
    .append('div')
    .attr('class', 'tooltip');

var parseTime = d3.timeParse("%Y");
var timeFormat = d3.timeFormat('%Y');
var formatAsPercentage = d3.format(".1%");

var LNxScale = d3.scaleTime()
    .range([0, LNwidth]);

var LNyScale = d3.scaleLinear()
    .range([LNheight, 0]);

var LNcolorScale = d3.scaleOrdinal()
    .range(["#e41a1c","#43a2ca","#008837","#984ea3","#ff7f00","#253494","#a65628","#f259ab","#525252","#000000"]);

var LNline = d3.line()
    .x(function(d){ return LNxScale(d.Year);
    })
    .y(function(d){ return LNyScale(d.Service);
    })
    //.curve(d3.curveBasis);

var LNx_axis = d3.axisBottom()
    .scale(LNxScale)
    .tickFormat(d3.timeFormat("%y"));

var LNy_axis = d3.axisLeft()
    .scale(LNyScale)
    .tickFormat(d3.format(".0%"));


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

////////////////////////////////////////////////////////////////////////////

var RegionIdByRegion = {};
var RegionNameByRegionId = {};
var RegionNameByCountryId = {};
var CountryNameByCountryId = {};
var RegionIdByCountryId = {};

///////////////////  draw smallmultiple linechart //////////////////////////
d3.csv("data/ShareOfService_country.csv", type, function(error, csv_data) {
        if (error) throw error;

  LNxScale.domain(d3.extent(csv_data, function(d) { return d.Year; }));
  //console.log(xScale.range())
  LNyScale.domain(d3.extent(csv_data, function(d){ return d.Service;}));
  //console.log(LNyScale.domain())
  //console.log(csv_data);

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
  //console.log(region_keys);

  /////////////set color domain according to regions/////////
  LNcolorScale.domain(region_keys);
  //console.log(LNcolorScale.domain());

  /////////////////  transforming data //////////////////////
  nested_data = d3.nest()
    .key(function(d) { return d.Gender;})
    .key(function(d) { return d.Country_id})
    .entries(csv_data);
  console.log(nested_data);

  /////////////////  draw line chart //////////////
  drawlinechart("#country_linechart")

  /////////////////  draw div of legend //////////////
  var LGlegend = d3.select('#legend_area')
      .selectAll("svg")
      .data(region_keys)
      .enter()
      .append("svg")
      //.attr('class','legendtext')
      .attr("height", LGheight+LGmargin.top+LGmargin.bottom)
      .attr("width", LGwidth+LGmargin.left+LGmargin.right)
      .append('g')
      //.attr('transform', 'translate(' + LGmargin.left + ',' + LGmargin.top + ')')
      .append('text')
      .attr('x','50%')
      .attr('y','80%')
      //.attr('y', 15)
      .attr('class','legend_tag')
      .attr('fill',LNcolorScale)
      .attr('font-size','13px')
      .attr('font-weight','bold')
      .attr('text-anchor','middle')
      .text(function(d) { return d })
      .style("cursor", "pointer")
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

      //http://bl.ocks.org/jessicafreaner/8fb0ac6c12aa1dab5f70
      var active_legend = [];
      function LGclick(d) {
        // console.log(active_legend);
        index = active_legend.indexOf(d);
        // console.log(active_legend.indexOf(d));
        if (index > -1) {
          active_legend.splice(index,1);
          d3.selectAll("path.line_region_"+RegionIdByRegion[d])
            .transition()
            .duration(50)
            .style("opacity",0.1)
            .style("stroke-width", 1);
          d3.select(this)
            .style("font-size", "13px");
        } else {
          // not active previously
          active_legend.push(d);
          d3.selectAll("path.line_region_"+RegionIdByRegion[d])
            .transition()
            .duration(50)
            .style("opacity",1)
            .style("stroke-width", 2);
          d3.select(this)
            .style("font-size", "18px");
        }
      }

});


function drawlinechart(NameOfDiv){
          /////////////////  draw  smallmultiple linechart ///////////
        var LNsvg = d3.select(NameOfDiv)
            .selectAll("svg")
            .data(nested_data)
            .enter()
            .append('svg')
            .attr("class","linechart")
            .attr('width', (LNwidth + LNmargin.left + LNmargin.right))
            .attr('height', (LNheight + LNmargin.top + LNmargin.bottom))

        var LNg = LNsvg.append('g')
                .attr('transform', 'translate(' + LNmargin.left + ',' + LNmargin.top + ')');

        var countryLines = LNg.selectAll(".country_line")
          .data(function(d) {return d.values})
          .enter().append("g")
          .attr("class", "country");

        countryLines
          .append("path")
          .attr("class", function(d) {return ("line_region_"+ RegionIdByCountryId[d.key]); })
          .attr("id", function(d) {return ("tag_country_"+ d.key); })
          .attr("d", function(d) { return LNline(d.values);})
          .style("stroke", function(d) { return LNcolorScale(RegionNameByCountryId[d.key]); })
          .attr('fill', 'none')
          .attr("opacity", 0.1)
          .on("mouseover",LNmouseOver)
          .on("mousemove",LNmouseMove)
          .on("mouseout",LNmouseOut);

        /////////////////  draw  axis //////////////
        LNg.append("g")
          .attr("class", "axis")
          .attr("transform", "translate(0," + LNheight + ")")
          .call(LNx_axis)
          .selectAll("text")  
          .style("text-anchor", "end");

        LNg.append("g")
          .attr("class", "axis")
          .call(LNy_axis)

        LNg.append("g")
          .attr("class", "label")
          .attr("transform", "translate(" + LNxScale(parseTime(2012)) + ",0)")
          .call(LNy_axis);

        ///////////////// append name fo chart //////////////
        LNg.append("g")
          .attr("class", "topic")
          .append("text")
          .attr("transform", "translate(0," + (-LNmargin.top/3) + ")")
          .attr("font-size", 13)
          //.attr("font-weight", "bold")
          .text(function(d){ return d.key});

        //console.log(LNxScale(parseTime(2012)))

        function LNmouseOver(d){
          //console.log(d,d.key,CountryNameByCountryId[d.key])
          // d3.selectAll("g.country").selectAll("path")
          //     .transition()
          //     .style("opacity",0.2)

          d3.selectAll("#tag_country_"+ d.key)
              .transition()
              .duration(100)
              .style("opacity",1)
              .style("stroke-width", 2);

          // d3.select(this)
          //     .transition()
          //     .style("opacity",1)
          //     .style("stroke-width",3);

          //these 1 line of code taken fromhttp://stackoverflow.com/questions/42173318/d3v4-stacked-barchart-tooltip
          // var thisName = d3.select(this.parentNode).datum().key;


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
}

////////////////////////////////////////////////////////////////////////////
///////////////////// finish draw smallmultiple line ///////////////////////


d3.csv("data/ShareOfService_region.csv", type, function(error, csv_data) {
  if (error) throw error;

  // LCxScale.domain(d3.extent(csv_data, function(d) { return d.Year; }));
  //console.log(xScale.range())
  // LCyScale.domain(d3.extent(csv_data, function(d){ return d.Service;}));

  // console.log(LCyScale.domain());
  // console.log(csv_data);

  var RegionNameByRegionId = {};

  csv_data.forEach(function(d) { 
    RegionNameByRegionId [d.Region_id] = d.Region
  });

  nested_data = d3.nest()
    .key(function(d) { return d.Gender;})
    .key(function(d) { return d.Region_id})
    //.sortKeys(d3.ascending)
    .entries(csv_data);

  console.log(nested_data);

  var region_data = d3.nest().key(function(d) { return d.Region}).entries(csv_data);
  var region_keys = region_data.map(function(d) { return d.key;});

  drawlinechart("#region_linechart")
});

function type(d) {
  d.Year = parseTime(d.Year);
  d.Service = +d.Service/100;
  return d;
};