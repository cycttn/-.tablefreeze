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
    
    var keys = [37, 38, 39, 40];
    
    $.tableFreeze = function(tbl, options){
        this.$this = $(tbl); //IMPORTANT! 
        this.options = $.extend({}, defaults, options);
        
        this.x = 0; 
        this.y = 0; 
        
        this.hdr = []; //cache to store complex header architecture! 
        
        this.h = this.$this.height();
        this.w = this.$this.width();
        
        var $p = this.$this.parent(), wi = $p.width(), hi = $p.height();
        
        var __this = this;
        if( this.options.scrollbar ){
            $.loadJs('scrollbar/scrollbar.js', function(){
                __this.sb = __this.$this.scrollbar(); //shows scrollbar
            });
        }
        
        //Unit widths and lengths for scrollbar. 
        //w = width of td; 
        //uw = 1 - (w-wi)/(w-this.w); 
        var wtd = this.$this.find('td').eq(this.options.cols).width();
        var htd = this.$this.find('tbody tr').eq(0).height();
        var uw = 1-(wtd-wi)/(wtd-this.w), uh = 1 - (htd-hi)/(htd-this.h);
        
        this.lastDrag = 0; 
        
        this.$this.on('scrollbar::dragX', function(e, amt){
            var d = amt - __this.lastDrag;
            if( Math.abs(d) >= uw ){
                setFreeze.call(__this, 0, (d>0)? 0 : 1 );
                __this.lastDrag = amt;
            }
        }).on('scrollbar::dragStopped', function(){
            __this.lastDrag = 0;
        }).on('scrollbar::dragY', function(e, amt){
            var d = amt - __this.lastDrag;
            if( Math.abs(d) >= uh){
                setFreeze.call(__this, 1, (d>0)? 0 : 1 );  
                __this.lastDrag = amt;
            }             
        });
        
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
                (__this.x > 0)? setFreeze.call(__this, 0, 0) : setFreeze.call(__this, 0, 1);
            }
            
            if( Math.abs(__this.y) > __this.options['threshold-y'] ){
                (__this.y > 0)? setFreeze.call(__this, 1, 1) : setFreeze.call(__this, 1, 0); 
            }
            
            e.preventDefault();
            e.stopPropagation();
        });
        
    };
    
    $.tableFreeze.prototype.$get = function(){ return this.$this; };
    
    $.tableFreeze.prototype.set = function(cols, rows){
        this.options.cols = cols;
        this.options.rows = rows;
    };

    /**
     * Update scroll bars
     */
    $.tableFreeze.prototype.updateScrollbars = function(){
        var $p = this.$this.parent(), w=$p.width(), h=$p.height(),
            wi = this.$this.width(), hi = this.$this.height();
    
        if( hi < h ) hi = h; 
        if( wi < w ) wi = w;
        
        this.sb.update( 1-(w-wi)/(w-this.w) ,  1-(h-hi)/(h-this.h) );
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
     */
    function setFreeze(dir, amt){
        (dir)? setFreezeY.call(this, amt) : setFreezeX.call(this, amt);
        this.updateScrollbars();
    }
    
    function setFreezeX(amt){
        var hidden = []; 
        
        //Go right
        if( amt ){
            //Need to deal with grouped th; 
            this.$this.find('thead tr').each(function(){
                hidden.push( $(this).find('th.hidden').last().removeClass('hidden'));
            });
            this.$this.find('tbody tr').each(function(){
                hidden.push( $(this).find('td.hidden').last().removeClass('hidden') );
            });
            this.$this.trigger('tableFreeze::unfrozen', [0, hidden]);    
            
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
                    hidden.push( curr );
                }
            });
            
            this.$this.find('tbody tr').each(function(){
                hidden.push( $(this).find('td:not(.hidden)').eq(col).addClass('hidden'));
            });            
            this.$this.trigger('tableFreeze::frozen', [0, hidden]);
        }
        
        this.x = 0; 
    }
    
    function setFreezeY(amt){
        var t = []; 

        //Go down
        if( amt ){
            t.push( this.$this.find('tbody tr.hidden').last().removeClass('hidden') );
            this.$this.trigger('tableFreeze::unfrozen', [1, t]);
        //Go up if not isStop    
        }else if( !isStopY.call(this) ){
            t.push( this.$this.find('tbody tr:not(.hidden)').first().addClass('hidden') );
            this.$this.trigger('tableFreeze::frozen', [1, t]);
        }        
        
        this.y = 0;
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