
var formatAsPercentage = d3.format(".1%");
////////////////////// init scatter plot////////////////////////////////////////////
var width = document.getElementById("scatter_plot").clientWidth*0.6;
var height = 400;

var margin = {
    top: 30,
    left: 80,
    right: 30,
    bottom: 50
};

var SPsvg = d3.select('#scatter_plot')
    .append('svg')
        .attr('height',height)
        .attr('width',width)
        .attr('class','scatterplot')
    .append('g')
    .attr('transform','translate('+ margin.left + ',' + margin.top + ')');

width = width - margin.left - margin.right;
height = height - margin.top - margin.bottom;

var x_scale = d3.scaleLinear()
        .rangeRound([0,width])

var y_scale = d3.scaleLinear()
        .rangeRound([height,0])

var SPline = d3.line()
    .x(function(d){ return x_scale(d.x);})
    .y(function(d){ return y_scale(d.y);})

var color_scale = d3.scaleOrdinal()
.range(["#e41a1c","#43a2ca","#008837","#984ea3","#ff7f00","#253494","#a65628","#f259ab","#525252"]);

var SPtooltip = d3.select('body')
    .append('div')
    .attr('class', 'tooltip');

////////////////////// init axis////////////////////////////////////////////////////////////

var x_axis = d3.axisBottom(x_scale)
    .tickFormat(d3.format(".0%"));

var y_axis = d3.axisLeft(y_scale);

SPsvg.append('g')
    .attr('transform', 'translate(0, ' + height + ')')
    .attr('class', 'x_axis');

SPsvg.append('g')
    .attr('class', 'y_axis');

// console.log(x_scale.domain())

////////////////////// init legend////////////////////////////////////////////
var SPLGwidth = document.getElementById("scatter_plot").clientWidth*0.4;
var SPLGheight = 400;

var SPLGmargin = {
    top: 50,
    left: 50,
    right: 20,
    bottom: 20
};

var SPLGsvg = d3.select('#scatter_plot')
    .append('svg')
    .attr('height',SPLGheight)
    .attr('width',SPLGwidth)
    .attr('class','scatterplot_legend')
    .append('g')
    .attr('transform','translate('+ SPLGmargin.left + ',' + SPLGmargin.top + ')');

SPLGwidth = SPLGwidth - SPLGmargin.left - SPLGmargin.right;
SPLGheight = SPLGheight - SPLGmargin.top - SPLGmargin.bottom;

var selector=d3.select('#inds');

selector.on("change", function (){
    LoadData(this.value);
});

var filtered_data;
var nested_data_regression;
var region_keys;
var reg_data;
var RegionNameByRegionId = {};
////////////////////////////////// load data //////////////////////////////////////////////////
function LoadData(sector){
    d3.csv('data/correlation2.0.csv',type, function(data){
        filtered_data=data.filter(function(d){ return +d.GDP_per_Capita >0 && d.Sector == sector })
        //processing data//////////////////////////////
        /////////////////preparing data for draw regression line for total ////////////////////////////////////
        var values_x1=[];
        var values_y1=[];
        reg_data=[];

        filtered_data.forEach(function(d) { 
            RegionNameByRegionId [d.Region_id] = d.Region
            values_x1.push(+d.Share );
            values_y1.push(+d.GDP_per_Capita);
        });

        reg_data.push({key:"Total", values: findLineByLeastSquares(values_x1,values_y1)[0]});
        // console.log(reg_data)
        /////////////////preparing data for draw regression line  of each region//////////////////////////////
        var nested_data_origin = d3.nest()
            .key(function(d) { return d.Region_id;})
            .sortKeys(d3.ascending)
            .entries(filtered_data);
            
        nested_data_regression = nested_data_origin.map(function(d) {
            var values_x2=[];
            var values_y2=[];
            var reg={};
            d.values.map(function(d) {
                values_x2.push(+d.Share);
                values_y2.push(+d.GDP_per_Capita);
            })
            var reg = findLineByLeastSquares(values_x2,values_y2);
            return {
                key: d.key,
                values: reg[0]
            }
        });

        // console.log(nested_data_origin)
        // console.log(nested_data_regression)
        ///////////////////// set domain of axis according to filtered data  ////////////////
        region_keys = nested_data_origin.map(function(d) { return d.key;});
        color_scale.domain(region_keys);

        ///////////////////// call function to draw scatterplot and legend  ////////////////
        drawSP(0);
        drawSP_legend();
        d3.select('text.axis_labelx').text("Share_of_Employment_in_"+sector)
        d3.selectAll("text.sp_legend_text")
            .style("font-size", "13px")
            .style("font-weight", "normal");
        active_SPlegend = 0;
    });
};

LoadData("Services");


// draw scatterplot /////////////////////////////////////////////////////////////////
function drawSP(if_filtered,input_region) { 
    // console.log(nested_data_regression)
    ///////////////////// filtering data /////////////////////  
    if (if_filtered===1) {
        filtered_data_dots=filtered_data.filter(function(d){ return +d.Region_id === +input_region  })
        nested_data_line=nested_data_regression.filter(function(d){ return +d.key === +input_region; })
    } else{
        filtered_data_dots=filtered_data;
        nested_data_line=reg_data;
    }

    //console.log(if_filtered,input_region)
    ///////////////////// set domain of x,y scale according to filtered data  //////////////// 
    x_scale.domain(d3.extent(filtered_data_dots,function(d){return +d.Share;}));
    y_scale.domain(d3.extent(filtered_data_dots,function(d){return +d.GDP_per_Capita;}));
    minYdomain=d3.min(filtered_data_dots,function(d){return +d.GDP_per_Capita;});
    maxYdomain=d3.max(filtered_data_dots,function(d){return +d.GDP_per_Capita;});

    /////////////////////   draw dots///////////////////////////////////////////////////////
    var dots = SPsvg.selectAll('.sp_dot')
            .data(filtered_data_dots);

    //exit
    dots
        .exit()
        .transition()
        .duration(1000)
        .attr('opacity',0.2)
        .attr('cy', y_scale(minYdomain))
        .remove();

    //enter
    var new_dots = dots
        .enter()
        .append('circle')
        .attr('class','sp_dot')
        .attr('id',function(d) { return 'tag_sp'+d.Region_id;})
        .attr('r',5)
        .attr('cx',function(d) {return x_scale(+d.Share);})
        .attr('cy', y_scale(minYdomain))
        .attr('opacity',0.2)
        .attr("visibility", function(d){if (d == null) return "hidden";})
        .style("display", function(d) { return d == null ? "none" : null; })
        .attr('fill', function(d) {return color_scale(d.Region_id);})
        .attr('stroke', 'black')
        .attr('stroke-width','0.5px');

    //updata
    new_dots.merge(dots)
        .transition()
        .duration(1500)
        .attr('class','sp_dot')
        .attr('id',function(d) {return 'tag_sp_'+d.Region_id;})
        .attr('cx',function(d) {return x_scale(+d.Share);})
        .attr('cy',function(d) {return y_scale(+d.GDP_per_Capita);})
        .attr('fill',function(d) { return color_scale(d.Region_id);})
        .attr('r',5)
        .attr('opacity',1)
        .attr('stroke', 'black')
        .attr('stroke-width','0.5px');

    d3.selectAll('circle.sp_dot') 
        .on('mouseover',SPmouseOver)
        .on('mousemove',SPmouseMove)
        .on('mouseout',SPmouseOut);


    /////////////////////   draw axis/////////////////////////////////////////////////////////////
    SPsvg.select('.x_axis')
        .transition()
        .duration(1000)
        .call(x_axis);

    SPsvg.select('.y_axis')
        .transition()
        .duration(1000)
        .call(y_axis);

    /////////////////////   draw regression lines/////////////////////////////////////////////////

    var regionLines = SPsvg.selectAll('.sp_path')
            .data(nested_data_line);

    regionLines
        .exit()
        .remove();

    var new_regionLines = regionLines
        .enter()
        .append('path')
        //.attr("d", function(d) { return SPline(d.values);})
        .attr('class','sp_path')
        .attr('id',function(d) { return 'tag_sp_'+ d.key;})
        .attr('stroke-width',2)
        .attr('opacity',0.5)
        .attr("stroke-dasharray", "2,2");

    new_regionLines.merge(regionLines)
        .transition()
        .duration(1200)
        .attr("d", function(d) { return SPline(d.values);})
        .attr('class','sp_path')
        .attr('id',function(d) { return 'tag_sp_'+ d.key;})
        .style("stroke", function(d) { return d.key=='Total'? '#b3de69':color_scale(d.key); })
        .attr('fill', "none" )
        .attr('stroke-width',2)
        .attr('opacity',1)
        .attr("stroke-dasharray", "2,2");

    /////////////////////   function for mouseover event ////////////////////////////////
    function SPmouseOver(d){
        console.log(d);
        d3.selectAll(".sp_dot")
            .transition()
            .duration(500)
            .style("opacity",0.2);

        d3.select(this)
            .transition()
            .duration(500)
            .style('opacity', 1)
            .style('r',10);

        SPtooltip
            .style('display', null)
            .html( '<p>Country: '+ d.Country
              + '<br>Share of Employment in Services: ' +  formatAsPercentage(d.Share)
              + '<br>GDP per Capita: ' + Math.round(d.GDP_per_Capita,-2) + '</p>');
      };

    function SPmouseMove(d){
        SPtooltip
            .style('top', (d3.event.pageY - 15) + "px")
            .style('left', (d3.event.pageX + 15) + "px");
      };

    function SPmouseOut(d){
        SPtooltip
            .style('display', 'none');

        d3.selectAll("circle.sp_dot")
            .transition()
            .duration(500)
            .style("opacity",1)
            .style('r',5);
    };

};//draw scatterplot finish

/////////////////////   draw legend //////////////////////////////////////////////////
function drawSP_legend () {

    SPLGsvg.selectAll('.sp_legend_rect')
        .data(region_keys)
        .enter()
        .append('rect')
        .attr('class','sp_legend_rect')
        .attr('width', 5)
        .attr('height', 20)
        .attr('y', function(d, i) { return i * 30 ; })
        .attr('x', 0)
        .attr('fill', function(d){ return color_scale(d) });

    SPLGsvg.selectAll('.sp_legend_text')
        .data(region_keys)
        .enter()
        .append('text')
        .attr('class','sp_legend_text')
        .attr('font-size','13px')
        .attr('y', function(d, i) { return i * 30 + SPLGmargin.top*0.3; })
        .attr('x', SPLGmargin.left/2)
        .attr('fill', function(d){ return color_scale(d) })
        .text(function(d){ return RegionNameByRegionId[d]})
        .on("click", SPLGclick)
        .style("cursor", "pointer");
        
    var active_SPlegend;
    function SPLGclick(d) {
        //console.log(d,active_SPlegend)
      if (active_SPlegend === d) {
        drawSP(0)
        d3.selectAll("text.sp_legend_text")
            .style("font-size", "13px")
            .style("font-weight", "normal");
        active_SPlegend = 0;
      } else {
        // active relating elements
        drawSP(1,d)
        d3.selectAll("text.sp_legend_text")
            .style("font-size", "13px")
            .style("font-weight", "normal");
        d3.select(this)
            .style("font-size", "20px")
            .style("font-weight", "bold");
        active_SPlegend = d;
      }              
    };
};

drawSP_axislabel();

function drawSP_axislabel(){
    ////////////////////// append axis label//////////////////////////////////////////////////////////
    SPsvg.append("text")             
        .attr("transform","translate(" + (width/2) + " ," + (height + margin.bottom/2 + 10) + ")")
        .attr("text-anchor", "middle")
        .text("Share_of_Employment_in_Services")
        .attr("class","axis_labelx");
    //.attr('font-size','16px');

    SPsvg.append("text")
        .attr("transform", "rotate(-90)")
        //moving the y position from the new 0 coordinate halfway up the height of the graph area
        .attr("x",0 - (height/2) + (margin.bottom/2))
        //moving the x position to the left from the new 0 coordinate by the margin.left value           
        .attr("y",0 - margin.left)
        //dy used with em (font size units) is very useful for vertically aligning text relative to the absolute y coordinate
        .attr("dy", "1em")
        .text("GDP_per_Capita")
        .attr("class","axis_labely");
        //.attr('font-size','16px');
}

///fitting a line for dots by linear regression ////////////////////////////////////////////
//this function was taken from https://dracoblue.net/dev/linear-least-squares-in-javascript/
//modified to avoid creating new coordinates out of x scale or y scale
function findLineByLeastSquares(values_x, values_y) {
    var sum_x = 0;
    var sum_y = 0;
    var sum_xy = 0;
    var sum_xx = 0;
    var count = 0;
    /** We'll use those variables for faster read/write access.*/
    var x = 0;
    var y = 0;
    var values_length = values_x.length;

    if (values_length != values_y.length) {
        throw new Error('The parameters values_x and values_y need to have same size!');
    }
    /** Nothing to do*/
    if (values_length === 0) {
        return [ [], [] ];
    }
    /** Calculate the sum for each of the parts necessary.*/
    for (var v = 0; v < values_length; v++) {
        x = values_x[v];
        y = values_y[v];
        sum_x += x;
        sum_y += y;
        sum_xx += x*x;
        sum_xy += x*y;
        count++;
    }

    /*Calculate m and b for the formular:y = x * m + b*/
    var m = (count*sum_xy - sum_x*sum_y) / (count*sum_xx - sum_x*sum_x);
    var b = (sum_y/count) - (m*sum_x)/count;

    /* We will make the x and y result line now*/
    // var result_values_x = [];
    // var result_values_y = [];
    var result_values = [];

    for (var v = 0; v < values_length; v++) {
        x = values_x[v];
        y = x * m + b;
        if( y >= d3.extent(values_y)[0] && y <= d3.extent(values_y)[1]
        ){
            result_values.push({x,y})
        }               
    }

    return [result_values];
};

//console.log(findLineByLeastSquares(values_x,values_y))

function type(d) {
d.GDP_per_Capita = + d.GDP_per_Capita;
d.Share = +d.Share/100;
return d;
};
