
////////////////////////////////////////////////////////////////////////////
//////////////////////////////  init map   /////////////////////////////////
  //var dateParse = d3.timeParse('%Y %b');
var MAPwidth = document.getElementById('map').clientWidth;
var MAPheight = 400;
var MAPmargin = {top: 20, right: 20, bottom: 0, left: 20};

MAPwidth = MAPwidth - MAPmargin.left - MAPmargin.right;
MAPheight = MAPheight - MAPmargin.top - MAPmargin.bottom;

var MAPtooltip = d3.select('body')
  .append('div')
  .attr('class', 'tooltip');

var MAPsvg = d3.select("#map")
  .append("svg")
  .attr("width", MAPwidth)
  .attr("height", MAPheight)
  .attr("class","worldmap");

var MAPcolor_scale = d3.scaleQuantile()
  .range(colorbrewer.YlGnBu[9])
  .domain([0,90]);

var projection = d3.geoMercator();

var path = d3.geoPath()
    .projection(projection);

var world_data, sector_data;

d3.queue()
  .defer(d3.json, "data/readme-world.json")
  .defer(d3.csv, "data/ShareOfAll3Secotr_country.csv")
  .await(function(error, world, sector){
          if (error) throw error;
          world_data=world;
          sector_data=sector;
          drawmap("2012");
});

var SrateById = {};
var ArateById = {};
var IrateById = {};
var nameById = {};
var GDPById = {};

function drawmap(year) {

  /////////////////////////////////// processing data ////////////////////////////////////
  year_sector_data = sector_data.filter(function(d) {
      return +d.Year === +year;
  });

  var countries_data = topojson.feature(world_data, world_data.objects.countries).features;

  // the way of acquiring data attribute according to id 
  // below code was taken from http://bl.ocks.org/micahstubbs/8e15870eb432a21f0bc4d3d527b2d14f and were modified 
  year_sector_data.forEach(function(d) {
    SrateById[d.Country_id] = +d.Services;
    ArateById[d.Country_id] = +d.Agriculture;
    IrateById[d.Country_id] = +d.Industry;
    GDPById[d.Country_id] = d.GDP_per_Capita;
    nameById[d.Country_id] = d.Country;
  });

  ////////////////////////////////////////////////////////////////////////////////////////
  projection
      .scale(1)
      .translate([0,0]);

  var b = path.bounds(topojson.feature(world_data, world_data.objects.countries));
  var s = 1 / Math.max((b[1][0] - b[0][0])/MAPwidth, (b[1][1] - b[0][1])/MAPheight);
  var t = [(MAPwidth - s * (b[1][0] + b[0][0]))/2, (MAPheight - s * (b[1][1] + b[0][1]))/2];

  projection
      .scale(s)
      .translate(t);


  //////////////////////////////   draw the map   /////////////////////////////////////////

  //select
  var MAPg = MAPsvg.append("g").attr("class","map");
  var countries=MAPg.selectAll(".country_path")
        .data(countries_data);

  //enter
  countries
      .enter()
      .append("path")
      .attr("class", "country_path")
      .attr("fill", function(d) { return MAPcolor_scale(SrateById[+d.id] | 0); })
      .style('stroke', 'white')
      .style('stroke-width', '0.5px')
      .attr("d", path)
      .on('mouseover',MAPmouseOver)
      .on('mousemove',MAPmouseMove)
      .on('mouseout',MAPmouseOut);

  var legend = MAPsvg.selectAll('.maplegend')
      .data(colorbrewer.YlGnBu[9]);

  var new_legend = legend
      .enter()
      .append('g')
      .attr('class', 'maplegend')
      //.attr("transform", "translate(" + margin.left + "," + height + ")");

  new_legend.merge(legend)
          .append('rect')
          .attr('width', 20)
          .attr('height', 20)
          .attr('y', function(d, i){ return (MAPheight - i * 20 - 2 * 20); })
          .attr('x', MAPmargin.left/2)
          .attr('fill', function(d){ return d })
          .attr('stroke', 'white')
          .attr('stroke-width', '0.5px');

  new_legend.merge(legend)
      .append('text')
          .attr('font-size','11px')
          //.attr('font-family',"sans-serif")
          .attr('y', function(d, i){ return (MAPheight - i * 20 - 2*8); })
          .attr('x', MAPmargin.left/2 + 25)
          .text(function(d){
              var high = MAPcolor_scale.invertExtent(d)[1];
              var low = MAPcolor_scale.invertExtent(d)[0];
              return low;
          });

  /////////////////////////////  create mouseover event  //////////////////////////////////
  function MAPmouseOver(d){
    //console.log(d);
    d3.select(this)
        .transition()
        .duration(100)
        .style('opacity', 1)
        .style("stroke","#fe9929")
        .style("stroke-width",2);

    MAPtooltip
        .style('display', null)
        .html( '<p>Year: '+ year 
          + '<br>Country: '+ nameById[d.id] 
          + '<br>Share of Employment in Agriculture: ' + Math.round(ArateById[d.id],-2) + '%'
          + '<br>Share of Employment in Industry: ' + Math.round(IrateById[d.id],-2) + '%'
          + '<br>Share of Employment in Services: ' + Math.round(SrateById[d.id],-2) + '%'
          + '<br>GDP per Capita: ' + Math.round(GDPById[d.id],-2) + '</p>');

    //////////////// when mouseovering, change attribute of **line_chart** //////
    d3.selectAll("g.country").selectAll("path")
        .transition()
        .duration(100)
        .style("opacity",0.1)
        .style("stroke-width",1);

    d3.selectAll("#tag_country_"+ d.id)
        .transition()
        .duration(100)
        .style("opacity",1)
        .style("stroke-width", 3);

  };

  function MAPmouseMove(d){
    MAPtooltip
        .style('top', (d3.event.pageY - 15) + "px")
        .style('left', (d3.event.pageX + 15) + "px");
  };


  function MAPmouseOut(d){
    d3.select(this)
        .transition()
        .duration(100)
        .style("stroke","white")
        .style("stroke-width",0.1);

    MAPtooltip
        .style('display', 'none');

    //////////////// when mouseout, change attribute of country **line chart** //////
    d3.selectAll("g.country")
        .selectAll("path")
        .transition()
        .duration(100)
        .style("opacity",0.1)
        .style("stroke-width",1);
  };

}; //<-----------  drawmap() function over

///////////////////////////////// slider ////////////////////////////////////////
var slider = d3.select('#year');
slider.on('change', function() {
    updatamap(this.value)
});

///////////////////////////// updata map ///////////////////////////////
function updatamap(year) {
    
    year_sector_data = sector_data.filter(function(d) {
      return +d.Year === +year;
    });
    
    // the way of acquiring data attribute according to id 
    // below code was taken from http://bl.ocks.org/micahstubbs/8e15870eb432a21f0bc4d3d527b2d14f and were modified 
    year_sector_data.forEach(function(d) {
      SrateById[d.Country_id] = +d.Services;
      ArateById[d.Country_id] = +d.Agriculture;
      IrateById[d.Country_id] = +d.Industry;
      GDPById[d.Country_id] = d.GDP_per_Capita;
      nameById[d.Country_id] = d.Country;
    });

    d3.select('g.map')
      .selectAll('path.country_path')
      .style("fill",function(d) { return MAPcolor_scale(SrateById[+d.id] | 0);})
      .on('mouseover',MAPmouseOver);

    function MAPmouseOver(d){
      // console.log(d);
      d3.select(this)
          .transition()
          .duration(100)
          .style('opacity', 1)
          .style("stroke","#fe9929")
          .style("stroke-width",2);

      MAPtooltip
          .style('display', null)
          .html( '<p>Year: '+ year 
            + '<br>Country: '+ nameById[d.id] 
            + '<br>Share of Employment in Agriculture: ' + Math.round(ArateById[d.id],-2) + '%'
            + '<br>Share of Employment in Industry: ' + Math.round(IrateById[d.id],-2) + '%'
            + '<br>Share of Employment in Services: ' + Math.round(SrateById[d.id],-2) + '%'
            + '<br>GDP per Capita: ' + Math.round(GDPById[d.id],-2) + '</p>');

      //////////////// when mouseovering, change attribute of **line_chart** //////
      d3.selectAll("g.country").selectAll("path")
          .transition()
          .duration(100)
          .style("opacity",0.1)
          .style("stroke-width",1);

      d3.selectAll("#tag_country_"+ d.id)
          .transition()
          .duration(100)
          .style("opacity",1)
          .style("stroke-width", 3);
    };
};

function type(d) {
  d.Year = parseTime(d.Year);
  d.Service = +d.Service/100;
  return d;
};