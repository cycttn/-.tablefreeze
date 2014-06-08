/**
 * Freezes table rows and cols; Having freeze means scrolling is available;
 * 
 * Shows scroll bar!
 * 
 * @param {type} $
 * @returns {undefined}
 */

;
(function($){
    
    var data_key = "tableFreeze";
    
    var defaults = {
        'cols': 1,
        'threshold-x': 35,
        'threshold-y': 35,
        'scrollbar': 1
    };
    
    //var keys = [37, 38, 39, 40];
    
    $.tableFreeze = function(tbl, options){
        this.$this = $(tbl); //IMPORTANT! 
        this.options = $.extend({}, defaults, options);
        
        this.x = 0; 
        this.y = 0; 
        
        this.hdr = []; //cache to store complex header architecture! 
        
        this.h = this.$this.height();
        this.w = this.$this.width();
        
        //Set scrolling event handlers
        var __this = this; 
        this.$this.on('mousewheel', function(e){
            var x, y; 
            
            if( e.originalEvent.wheelDeltaX || e.originalEvent.wheelDeltaY){
                x = e.originalEvent.wheelDeltaX/-40;
                y = e.originalEvent.wheelDeltaY;
            }else{
                x = e.originalEvent.deltaX; 
                y = e.originalEvent.deltaY;                
            }
            
            __this.x += x; __this.y+=y; 
            
            if( Math.abs(__this.x) > __this.options['threshold-x'] ){
                (__this.x > 0)? setFreezeX.call(__this, 0) : setFreezeX.call(__this, 1);
                __this.x =0;
            }
            
            if( Math.abs(__this.y) > __this.options['threshold-y'] ){
                (__this.y > 0)? setFreezeY.call(__this, 1) : setFreezeY.call(__this, 0); 
                __this.y =0;
            }
            
            e.preventDefault();
            e.stopPropagation();
        });
        
        if( !this.options.scrollbar ) return; //done!
        
        var obj = $.isPlainObject(this.options.scrollbar)? this.options.scrollbar : null; 
        this.sb = this.$this.scrollbar(obj);
        
        var $p = this.$this.parent(), wi = $p.width(), hi = $p.height();
        var hth = this.$this.find('thead').height();

        //Number of cols and rows (to hide) for percentages. 
        this.numRows = this.$this.find('tbody tr').length;
        this.numCols = this.$this.find('tbody tr').eq(0).find('td').length;

        //Get the number of rows currently showing
        this.numRows -= (hi-hth)/(this.h-hth)*this.numRows;
        this.numCols -= wi/this.w*this.numCols;
        
        this.hiddenRows = 0;
        this.hiddenCols = 0; 
                
        this.$this.on('scrollbar::dragX', function(e, amt){
            var diff = Math.ceil(amt*__this.numCols) - __this.hiddenCols; 
            if( diff == 0 ) return;            
            
            var abs = Math.abs(diff);
            for(var i=0; i<abs; i++){
                setFreezeX.call(__this, diff>0? 0:1 );
            }
        }).on('scrollbar::dragY', function(e, amt){
            var diff = Math.ceil(amt*__this.numRows) - __this.hiddenRows; 
            if( diff == 0 ) return;   
            
            var abs = Math.abs(diff);
            for(var i=0; i<abs; i++){
                setFreezeY.call(__this, diff>0? 0:1 );
            }
        });
        
    };
    
    $.tableFreeze.prototype.$get = function(){ return this.$this; };
    
    $.tableFreeze.prototype.set = function(cols/*, rows*/){
        this.options.cols = cols; //set number of cols.
        this.$this.find('.hidden').removeClass('hidden'); //show everything
        this.hiddenCols = 0;
        this.hiddenRows = 0;
        this.resetScrollbars();
       // this.options.rows = rows;
    };

    /**
     * Update scroll bars
     */
    $.tableFreeze.prototype.updateScrollbars = function(){
        /*var $p = this.$this.parent(), w=$p.width(), h=$p.height(),
            wi = this.$this.width(), hi = this.$this.height();
    
        if( hi < h ) hi = h; 
        if( wi < w ) wi = w;
        
        this.sb.update( 1-(w-wi)/(w-this.w) ,  1-(h-hi)/(h-this.h) );*/
        
        this.sb.update( this.hiddenCols/this.numCols, this.hiddenRows/this.numRows ); 
    };
    
    $.tableFreeze.prototype.resetScrollbars = function(){
        this.h = this.$this.height();
        this.w = this.$this.width();
        this.sb.reset();
        this.updateScrollbars();
    };

    /**
     * Freezes the rows and columns by showing/hiding when scrolling; 
     * need to determine when to stop hiding and when to show; 
     * @param dir - direction of freeze; 0 - x ; 1 - y;
     * @param amt - 0 - left/up; 1 - right/down; 
     *
    function setFreeze(dir, amt){
        (dir)? setFreezeY.call(this, amt) : setFreezeX.call(this, amt);
        this.updateScrollbars();
    }*/
    
    function setFreezeX(amt){
        //var hidden = []; 
        
        //Go right
        if( amt ){
            //Need to deal with grouped th; 
            this.$this.find('thead tr').each(function(){
                /*hidden.push(*/ $(this).find('th.hidden').last().removeClass('hidden') /*)*/;
            });
            this.$this.find('tbody tr').each(function(){
                /*hidden.push(*/ $(this).find('td.hidden').last().removeClass('hidden') /*)*/;
            });
            this.$this.trigger('tableFreeze::unfrozen', 0); //[0, hidden]);    
            this.hiddenCols--; 
            
        //Go left if not isStop    
        }else if( !isStopX.call(this) ){
            var col = this.options.cols; 
            
            this.$this.find('thead tr').each(function(){
                var curr = $(this).find('th:not(.hidden)').eq(col);
                var colspan = curr.attr('colspan');
                if( colspan && parseInt(colspan) > 1){
                    curr.attr('colspan', parseInt(colspan)-1 );
                }else{
                    curr.addClass('hidden');
                   // hidden.push( curr );
                }
            });
            
            this.$this.find('tbody tr').each(function(){
               /* hidden.push( */ $(this).find('td:not(.hidden)').eq(col).addClass('hidden')/*)*/;
            });            
            this.$this.trigger('tableFreeze::frozen', 0); //[0, hidden]);
            this.hiddenCols++; 
        }
        this.updateScrollbars();
    }
    
    function setFreezeY(amt){
       // var t = []; 

        //Go down
        if( amt ){
           /* t.push(*/ this.$this.find('tbody tr.hidden').last().removeClass('hidden') /*)*/;
            this.$this.trigger('tableFreeze::unfrozen', 1); //[1, t]);
            this.hiddenRows--;
        //Go up if not isStop    
        }else if( !isStopY.call(this) ){
            /*t.push(*/ this.$this.find('tbody tr:not(.hidden)').first().addClass('hidden') /*)*/;
            this.$this.trigger('tableFreeze::frozen', 1); //[1, t]);
            this.hiddenRows++;
        }        
        this.updateScrollbars();
    }
    
    /**
     * Determines when to stop freezing (when width of table == width of container)
     */
    function isStopX(){
        return this.$this.width()+15 <= this.$this.parent().width(); //Doesn't work in Safari!
    }
    
    /**
     * Determines when to stop freezing ( when height of table == height of container)
     */
    function isStopY(){
        return this.$this.height()+15 <= this.$this.parent().height();
    }
    
    /**
     * Freezes columns and rows on a table. 
     * @param {type} options
     * @returns {Array}
     */
    $.fn.tableFreeze = function(options){
        if( $(this).length != 1 ){
            var arr = [];
            $(this).each(function(){
                arr.push( $(this).tableFreeze(this, options) );
            });
            return arr; 
        }
        
        var l = $(this).data(data_key); 
        if( l instanceof $.tableFreeze ) return l;
        
        l = new $.tableFreeze(this, options);
        $(this).data(data_key, l);
        return l; 
    };
        
})(jQuery);