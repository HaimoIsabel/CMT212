
var CHRmargin = {top: 20, right: 10, bottom: 20, left: 30};
var CHRwidth = document.getElementById("barchart").clientWidth ;
//var height = document.getElementById("vis").clientHeight;

var CHRwidth = CHRwidth/3 - CHRmargin.left - CHRmargin.right;
var CHRheight = 120 - CHRmargin.top - CHRmargin.bottom;

var formatAsPercentage = d3.format(".1%");

var xScale = d3.scaleBand()
    .rangeRound([0, CHRwidth])
    .paddingInner(0.09);
    //.align(0.1);

var yScale = d3.scaleLinear()
    .rangeRound([CHRheight,0]);

var zScale = d3.scaleOrdinal()
    .range(["#ff8c00", "#6b486b","#98abc5" ]);

var Year_keys, Sector_keys;

d3.csv("data/ShareOfAll3Sector_region.csv", function(d, i, columns) {
    // add a column of total
    for (i = 3, t = 0; i < columns.length; i++) 
        t += d[columns[i]] = +d[columns[i]]; //???
        d.total = t;
        //console.log(d[columns[2]])
        return d;
    }, function(error, data) {
        if (error) throw error;
        //console.log(data);

        Sector_keys = data.columns.slice(3);
        Sector_keys_reverse = data.columns.slice(3).reverse()
        Year_keys = data.map(function(d,i) { return d.Year; });
        xScale.domain(Year_keys);
        zScale.domain(Sector_keys);
        // console.log(xScale.domain())
        bar_data = data;
        drawbarchart('Total')
});


function select(category) {
    update(category);        
}

function drawbarchart(category) {

    //filtering data
    CHRdata = bar_data.filter(function(d,i) {
        return d.Gender === category;
    });

    ///////////////////// transform data ////////////////////////////////
    //Data is nested by region
    var regions_data = d3.nest()
        .key(function(d) { return d.Region; })
        .entries(CHRdata);
    //with in each region, data is grouped into 3 array(sectors), and each array has 28 sub-array.
    regions_data.forEach(function(s,i) {
        //console.log(d);
        var stack = d3.stack()
            .offset(d3.stackOffsetExpand);
        s.stackdata = stack.keys(Sector_keys)(s.values);
    });

    ///////////////////// draw barchart////////////////////////////////
    var CHRsvg = d3.select("#barchart")
        .selectAll("svg")
        .data(regions_data)
        .enter()
        .append("svg")
        .attr("class", "barchart")
        .attr("id",function(d,i) { return "barchart_"+i })
        .attr("height", CHRheight + CHRmargin.top + CHRmargin.bottom)
        .attr("width", function(d,i) { return i==0 ? 3*(CHRwidth+CHRmargin.left+CHRmargin.right):(CHRwidth+CHRmargin.left+CHRmargin.right) }) 
        .append("g")
        .attr("transform", function(d,i) { return i==0 ? "translate(" + 8*CHRmargin.left + "," + CHRmargin.top + ")"
        :"translate(" + CHRmargin.left + "," + CHRmargin.top + ")" }) 

    //d3.selectAll("g.rects").remove();

    var rects = CHRsvg
        .selectAll('g.rects')
        .data(function(d) {return d.stackdata})
        .enter()
        .append("g") // 3 'g.rects' was created
        .attr("class","rects");

    rects
        .append("g") //used as container for all 28 'rect' elements
        .attr("class","rect") 
        .attr("fill", function(d) {return zScale(d.key);}) 
        .selectAll('rect.rect')
        .data(function(d) { return d;})
        .enter()                  
        .append("rect")
        .attr("class","rect")          
        .attr("x", function(d) {return  d.data["Region"] == "World" ? 1.5*xScale(d.data.Year) :xScale(d.data.Year);})
        .attr("y", function(d) { return yScale(d[1]);})
        .attr("width", function(d) { return  d.data["Region"] == "World" ? 1.5*xScale.bandwidth() : xScale.bandwidth();})
        .attr("height", function(d) { return yScale(d[0]) - yScale(d[1]);})
        .style("stroke-width",0.05)
        //give real data and projected data different opacity
        .attr("opacity",function(d) {if(d.data.Year<2013){ return 1 } else { return 0.6 }})
        .on("mouseover",CHRmouseOver)
        .on("mousemove",CHRmouseMove)
        .on("mouseout",CHRmouseOut);

    ////////////////////////// axis /////////////////////////////////    

    var x_axis = d3.axisBottom(xScale)
        .tickValues([1991,2005,2018]);

    var y_axis = d3.axisLeft(yScale)
        .ticks(5)
        .tickFormat(d3.format(".0%"));
        //.tickSize([6,6]);

    CHRsvg.append("g")
            .attr("class", "axis_barchart")
            .attr("id", function(d,i) { return "x_axis_"+i})
            .attr("transform", "translate(0 ," + (CHRheight) + ")")
            .call(x_axis);

    CHRsvg.append("g")
        .attr("class", "axis_barchart")
        .attr("transform", "translate(" + CHRmargin.left/3 + ",0)")
        .call(y_axis);

    CHRsvg.append("g")
        .attr("class", "topic")
        .append("text")
        .attr("transform", "translate(0," + (-CHRmargin.top*0.4) + ")")
        .attr('font-weight','bold')
        .attr("font-size",12)
        .text(function(d){return d.key})

    ///////////////// set axis for the first barchart //////////////////////////////  

    var x0Scale = d3.scaleBand()
    .rangeRound([0, 1.5*CHRwidth])
    .paddingInner(0.09)
    .domain(Year_keys);

    var x0_axis = d3.axisBottom(x0Scale)
        .tickValues([1991,2005,2018]);

    d3.select("#x_axis_0")
        .call(x0_axis);

    ///////////////// build title for the first barchart //////////////////////////
    var topic = d3.select("#barchart_0")
        .append('g')
        .attr("transform", "translate(" + (2*CHRmargin.left + 3* CHRwidth) + "," + CHRmargin.top +")")
        .append('text')
        .attr("class","tittle")
        .text("["+ category +"]")
        .attr('font-size',13);

    ///////////////// build legend for the first barchart //////////////////////////
    var legend = d3.select("#barchart_0").selectAll('.legend')
        .data(Sector_keys_reverse);
    //console.log(keys.slice().reverse())

    var new_legend = legend
        .enter()
        .append('g')
        .attr('class','legend')
        .attr("transform", "translate(" + ( 2*CHRwidth + 5*CHRmargin.left ) + "," + (CHRmargin.top+15) +")")

    new_legend.merge(legend)
        .append('rect')
        .attr('width',10)
        .attr('height',10)
        //.attr('x',function(d,i) {return width/3*i}
        .attr('y',function(d,i) {return CHRmargin.top*i})
        .attr('fill',zScale);

    new_legend.merge(legend)
        .append('text')
        .attr('font-size','11px')
        .attr('font-family',"avenir next")
        .attr('x', 15)
        .attr('y',function(d,i) {return CHRmargin.top*i + CHRmargin.top*0.5 })
        .attr('fill',zScale)
        //.attr('font-weight','bold')
        .text(function(d) { return d });

    ///////////////// mouseover event //////////////////////////////////////  

    function CHRmouseOver(d){

        d3.select(this)
            .transition()
            .style("stroke","white")
            .style("stroke-width",3);

        //these 1 line of code taken fromhttp://stackoverflow.com/questions/42173318/d3v4-stacked-barchart-tooltip
        var thisName = d3.select(this.parentNode).datum().key;
                 
        tooltip
            .style("display", null)
            .html( "<p>Year: "+ d.data.Year 
                + "<br>Sector: "+ thisName 
                + "<br>Share of Employment: " + formatAsPercentage(d[1]-d[0]) +"</p>");
    };

    function CHRmouseMove(d){
        tooltip
            .style("top", (d3.event.pageY - 25) + "px")
            .style("left", (d3.event.pageX + 15) + "px");
    };

    function CHRmouseOut(d){

        d3.select(this)
            .transition()
            .style("stroke","white")
            .style("stroke-width",0.05);


        tooltip
            .style("display", "none");
    };

    var tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip");

};//<-drawbarchart<-over

function update(category){
    //filtering data
    CHRdata = bar_data.filter(function(d,i) {
        return d.Gender === category;
    });

    //Data is nested by region
    var regions_data = d3.nest()
        .key(function(d) { return d.Region; })
        .entries(CHRdata);

    // console.log(regions_data);

    regions_data.forEach(function(s,i) {
        //console.log(d);
        var stack = d3.stack()
            .offset(d3.stackOffsetExpand);
        s.stackdata = stack.keys(Sector_keys)(s.values);
        // console.log(s.stackdata)
    });

    var CHRsvg = d3.select("#barchart").selectAll("svg.barchart").data(regions_data);

    var rects = CHRsvg.selectAll("g.rect")
        .data(function(d) {return d.stackdata});

    rects.selectAll("rect")
        .data(function(d) { return d;})
        .attr("y", function(d) { return yScale(d[1]);})
        .attr("height", function(d) { return yScale(d[0]) - yScale(d[1]);})

    d3.select('#barchart_0').select('text.tittle').text("["+ category +"]")
};

