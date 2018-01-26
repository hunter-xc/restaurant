var $TABLE = $('#table');
var $BTN = $('#export-btn');
var $EXPORT = $('#export');

$('#table-add').click(function () {
  var $clone = $TABLE.find('tr.hide').clone(true).removeClass('hide table-line');
  $TABLE.find('table').append($clone);
});

//$(document).ready(function(){
    //$('body').on('click','#table-addinsertt', function(e){
      //  $(this).closest('tr').after("<tr><td contenteditable="true">Newitem</td><td contenteditable="true">$0</td><td contenteditable="true">$0</td></tr>");
    //});
//});
//
$('.table-remove').click(function () {
  $(this).parents('tr').detach();
});


// A few jQuery helpers for exporting only
jQuery.fn.pop = [].pop;
jQuery.fn.shift = [].shift;

$BTN.click(function () {
  var $rows = $TABLE.find('tr:not(:hidden)');
  var headers = [];
  var data = [];
  
  // Get the headers (add special header logic here)
  $($rows.shift()).find('th:not(:empty)').each(function () {
    headers.push($(this).text().toLowerCase());
  });
  
  // Turn all existing rows into a loopable array
  $rows.each(function () {
    var $td = $(this).find('td');
    var h = {};
    
    // Use the headers from earlier to name our hash keys
    headers.forEach(function (header, i) {
      h[header] = $td.eq(i).text();   
    });
    
    data.push(h);
  });
  
  // Output the result
  $EXPORT.text(JSON.stringify(data));
});