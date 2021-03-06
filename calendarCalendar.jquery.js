;(function ( $, window, document, undefined ) {

    var d1 = new Date(), d2 = new Date(), pluginName = "calendarCalendar",
        defaults = {
            containerName: "calendarCalendar",
            lexicon: {
                titleDays: ['Su','Mo','Tu','We','Th','Fr','Sa'],
                shortDays: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
                longDays: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
                shortMonths: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
                longMonths: ['January','February','March','April','May','June','July','August','September','October','November','December'],
                startCalendarTitle: 'Arrive On',
                endCalendarTitle: 'Depart On',
                singleCalendarTitle: ''
            },
			startDateId: "calendar-start-date",
			endDateId: "calendar-end-date",
            startDate: d1,
            endDate: new Date(d2.setDate(d1.getDate()+1)),
            minDate: null,
            maxDate: null,
            onDateChange: function(){ },
            calculatePosition: function(element){ return this.calculatePosition(element); },
            onOpen: function(){ },
            onClose: function(){ },
            showPaddingDates: false,
            calendarMode: "range", //also accepts "single"
            showBackground: true,
            showCloseButton: false,
            closeButtonContent: 'x',
            closeOnDateSelect: false,
            initializeDateChange: true //run onDateChange when initilizing
        };

    function Plugin( element, options ) {
        this.element = element;

        this.options = $.extend(true, {}, defaults, options) ;

        this._defaults = defaults;
        this._name = pluginName;

        this.init();
    }


    Plugin.prototype = {

        init: function() {

            //polyfil for IE
            (function () {
                if ( typeof NodeList.prototype.forEach === "function" ) return false;
                NodeList.prototype.forEach = Array.prototype.forEach;
            })();

            this.open = false;

            this.container = $('#'+this.options.containerName);

            if(this.container.length == 0){
                this.container = $('<div>', { id: this.options.containerName, 'class': 'calendarCalendar' });
                $('body').append(this.container);
                this.container = $('#'+this.options.containerName);
            }
            this.container.removeClass('open');
            $(this.element).unbind("click", $.proxy(this.openCalendar,this)).bind("click", $.proxy(this.openCalendar,this));

            this.options.calendarMode = (this.options.calendarMode == "single" || this.options.calendarMode == "range") ? this.options.calendarMode : "range";

            if(this.options.startDateId == this.options.endDateId)
            	this.options.endDateId += "2";
            if(this.options.maxDate < this.options.minDate ){
            	this.options.maxDate = null;
            	this.options.maxDate = null;
            }
            this.dateUpdate(this.options.initializeDateChange);

            if(this.options.startDate != null) { this.options.startDate.setHours(0,0,0,0); }
            if(this.options.endDate != null) { this.options.endDate.setHours(0,0,0,0); }
            if(this.options.minDate != null) { this.options.minDate.setHours(0,0,0,0); }
            if(this.options.maxDate != null) { this.options.maxDate.setHours(0,0,0,0); }

            $(window).unbind("resize", $.proxy(this.resize,this)).bind("resize", $.proxy(this.resize,this));

            $(document).on('focus','*', $.proxy(this._limitFocus,this) );            

        },

        _limitFocus: function( event ) {
            var container = document.getElementById(this.options.containerName);
            if ( this.open && !$.contains(container, event.target ) && container != event.target ) {
              event.stopPropagation();
              this.container.find('*[tabIndex]').first().focus();
            }
        },

        openCalendar: function(){
            this._lastFocusedElement = $(':focus');

            if(!this.open){
                if(this.options.calendarMode == "range"){
                    this.options.onOpen(this.options.startDate, this.options.endDate, this.options.lexicon, this.element);
                } else {
                    this.options.onOpen(this.options.startDate, this.options.lexicon, this.element);
                }
            }

            this.drawCalendars();
            
        },

        closeCalendar: function(event){
            if (event.type != "keypress" || event.keyCode == 13){                                              
                this.open = false;
                this.container.removeClass('open');
                this.container.attr('tabindex', '-2');  
                if(this.options.calendarMode == "range"){
                    this.options.onClose(this.options.startDate, this.options.endDate, this.options.lexicon, this.element);
                }else{
                    this.options.onClose(this.options.startDate, this.options.lexicon, this.element);
                }
                setTimeout(function(){ this._lastFocusedElement.focus(); }.bind(this), 0);
                return 'closed';
            }
        },


        resize: function(){
            if(this.open){
                this.drawCalendars();
            }
            return 'resized';
        },

        drawCalendars: function() {

            var tabIndex = 1;
        	//this may not be overly efficient but it seems to be a negligable performance hit
            this.open = true;

            this.container.addClass('open');

            var exitDiv = "";
            if(this.options.showBackground){
                exitDiv = $('<div>', { "class": "background", "tabIndex": tabIndex++ });
                exitDiv.bind("click keypress",$.proxy(this.closeCalendar,this));
            }
            var closeButton = "";
            if(this.options.showCloseButton){
                closeButton = $('<div>', { "class":"close-button","tabIndex": tabIndex++ }).html(this.options.closeButtonContent);
                closeButton.bind("click keypress",$.proxy(this.closeCalendar,this));
            }
            if(this.options.calendarMode == "range"){
                var firstCal = this.generateCalendar(this.options.startDate, this.options.startDateId, this.options.lexicon.startCalendarTitle, tabIndex);
                var secondCal = this.generateCalendar(this.options.endDate, this.options.endDateId, this.options.lexicon.endCalendarTitle, firstCal.find('*[tabIndex]').length );
            }else{
                var firstCal = this.generateCalendar(this.options.startDate, this.options.startDateId, this.options.lexicon.singleCalendarTitle, tabIndex);
                var secondCal = '';
            }
            var calendars = $('<div>', { "class": "calendars "+this.options.calendarMode } ).html(firstCal).append(secondCal).append(closeButton);

            this.container.html(exitDiv).append(calendars);
            if(this.options.calculatePosition != null){
                try {
                    calendars.css( $.proxy( this.options.calculatePosition, this, $(this.element) )() );
                }
                catch(err) {
                    console.log('custom calculatePosition returned dud positioning - using the default positioning');
                    calendars.css( $.proxy( this.calculatePosition, this, $(this.element) )() );
                }
            }
            this.container.attr('tabindex', '0');
            this.container.focus();
            
        },

        calculatePosition: function(element) {
            var offset = element.offset();
            var result = { top: offset.top + element.outerHeight(), left: offset.left + element.outerWidth() };
            return result;
        },

        generateCalendar: function(date, id, title, tabIndex) {
            tabIndex = (typeof tabIndex !== 'undefined') ? tabIndex : 0;            

            var calendarClasses = "calendar";
            if(this.options.maxDate instanceof Date && +date.getMonth() == +this.options.maxDate.getMonth() && +date.getFullYear() == +this.options.maxDate.getFullYear())
                calendarClasses += " max-month";
            if(this.options.minDate instanceof Date && +date.getMonth() == +this.options.minDate.getMonth() && +date.getFullYear() == +this.options.minDate.getFullYear())
                calendarClasses += " min-month";

            var calendarMarkup = $('<div>', { id:id, "class": calendarClasses});
                var calendarHeader = $('<div>', { "class": "calendar-header" });
                    var calendarHeaderLeftArrow = $('<a>', { "class": "calendar-arrow left" });
                    if(calendarClasses.indexOf('min-month'))
                        calendarHeaderLeftArrow.attr('tabIndex', tabIndex++);
                    var calendarHeaderTitle = $('<div>', { "class": "calendar-title" });
                        var calendarHeaderTitleCaption = $('<div>', { "class": "calendar-caption" }).html(title);
                        var calendarHeaderTitleDate = $('<div>', { "class": "calendar-date" }).html(this.options.lexicon.longMonths[date.getMonth()] + " " + date.getFullYear());
                    var calendarHeaderRightArrow = $('<a>', { "class": "calendar-arrow right" });
                    if(calendarClasses.indexOf('max-month'))
                        calendarHeaderRightArrow.attr('tabIndex', tabIndex++);
            	var calendarMain = $('<div>', { "class": "caldendar-main" });
            		var calendarDays = $('<div>', { "class": "calendar-days calendar-table"});
            		var calendarDates = $('<div>', { "class": "calendar-dates calendar-table"});
            //create header
            calendarHeaderLeftArrow.bind( "click keypress", { date: date, month: date.getMonth() - 1  },$.proxy(this.monthClickEvent, this) );
            calendarHeaderRightArrow.bind( "click keypress", { date: date, month: date.getMonth() + 1  }, $.proxy(this.monthClickEvent,this) );

            calendarHeader.append(calendarHeaderLeftArrow);
            	calendarHeaderTitle.append(calendarHeaderTitleCaption);
            	calendarHeaderTitle.append(calendarHeaderTitleDate);
            calendarHeader.append(calendarHeaderTitle);
            calendarHeader.append(calendarHeaderRightArrow);

            calendarMarkup.append(calendarHeader);

            //generate day headings
            for(var i = 0; i<7; i++){
            	calendarDays.append($('<div>', { "class": "calendar-cell" }).html(this.options.lexicon.titleDays[i]));
            }

            var daysInMonth = new Date(date.getFullYear(), date.getMonth()+1, 0).getDate();
            var dayOffset = new Date(date.getFullYear(), date.getMonth(), 1).getDay();

            //generate padding days
            for(var i = dayOffset; i>0; i--){
            	var content;
            	if(this.options.showPaddingDates){
            		var paddingDate = new Date(date.getFullYear(), date.getMonth(),1);
            		paddingDate.setDate(paddingDate.getDate()-i);
            		content = paddingDate.getDate();
            	}else{
            		content = "&nbsp;"
            	}
            	calendarDates.append($('<div>', { "class": "calendar-cell disabled padding" }).html(content));
            }

            var today = new Date();
            today.setHours(0,0,0,0);

            //generate days
            for(var i = 1; i<=daysInMonth; i++){
            	var thisDate = new Date(date.valueOf());
            	thisDate.setDate(i);
                thisDate.setHours(0,0,0,0);

            	var classes = "calendar-cell";
            	if( (id == this.options.endDateId && thisDate <= this.options.startDate) ||
                    (thisDate < this.options.minDate && this.options.minDate instanceof Date  ) ||
                    (thisDate > this.options.maxDate && this.options.maxDate instanceof Date  ) ||
                    (id == this.options.startDateId && +thisDate == +this.options.maxDate && this.options.calendarMode == "range") )
            		classes += " disabled";
            	else
            		classes += " active";
            	if( i == date.getDate())
            		classes += " selected";
                if(thisDate.getTime() == today.getTime())
                    classes += " today";
                var day = $('<a>', { "class": classes }).html(i);
            	if( (classes.indexOf('disabled') == -1) ){
                    day.bind( "click keypress", { date: date, day: i, id: id  }, $.proxy(this.dayClickEvent,this) );
                    day.attr('tabIndex', tabIndex++);
                }
            	calendarDates.append(day);
            }
            //arse end paddings
            for(var i = 1; i <= 42 - (dayOffset+daysInMonth); i++){
            	var content;
            	if(this.options.showPaddingDates){
            		var paddingDate = new Date(date.getFullYear(), date.getMonth(),daysInMonth);
            		paddingDate.setDate(paddingDate.getDate()+i);
            		content = paddingDate.getDate();
            	}else{
            		content = "&nbsp;"
            	}
            	calendarDates.append($('<div>', { "class": "calendar-cell disabled padding" }).html(content));
            }

            calendarMain.append(calendarDays);
            calendarMain.append(calendarDates);

            calendarMarkup.append(calendarMain);

            return calendarMarkup;
        },

        dayClickEvent: function(event){
            if (event.type != "keypress" || event.keyCode == 13){                              
                event.data.date.setDate(event.data.day);
                this.dateUpdate();
                if(this.options.closeOnDateSelect)
                    if(this.options.calendarMode == "range" && event.data.id != this.options.endDateId)
                        this.drawCalendars();
                    else
                        this.closeCalendar(event);
                else{
                    this.drawCalendars();
                }
                this.container.find('.calendar-cell.active.selected').focus();                
            }
        },

        monthClickEvent: function(event){
            console.log('monthClickEvent');
            if (event.type != "keypress" || event.keyCode == 13){     
                var el = event.target;
                var parentId = $(el).parents('.calendar').attr('id');
                var classes = "";
                el.classList.forEach(function(e){
                    classes += "."+e;
                });
                event.data.date.setMonth(event.data.month);
                this.dateUpdate();
                this.drawCalendars();
                this.container.find("#" + parentId + " " + classes).focus();
            }
        },

        dateUpdate: function(runDateChange){
            runDateChange = (typeof runDateChange === 'undefined') ? true : runDateChange;

        	if(this.options.minDate instanceof Date && +this.options.minDate > +this.options.startDate){
        		this.options.startDate = new Date(this.options.minDate.valueOf());
        	}
            if(this.options.maxDate instanceof Date && +this.options.maxDate <= +this.options.startDate){
                this.options.startDate = new Date(this.options.maxDate.valueOf());
                if(this.options.calendarMode == "range")
                    this.options.startDate.setDate(this.options.startDate.getDate() - 1);
            }
        	if(this.options.maxDate instanceof Date && +this.options.maxDate < +this.options.endDate){
        		this.options.endDate = new Date(this.options.maxDate.valueOf());
        	}
        	if(+this.options.endDate <= +this.options.startDate){
        		this.options.endDate = new Date(this.options.startDate.valueOf());
        		this.options.endDate.setDate(this.options.endDate.getDate()+1);
        	}
            if(runDateChange){
                if(this.options.calendarMode == "range"){
                    this.options.onDateChange(this.options.startDate, this.options.endDate, this.options.lexicon );
                }else{
                    this.options.onDateChange(this.options.startDate, this.options.lexicon );
                }
           }
        }

    };

    $.fn[pluginName] = function ( options ) {
        return this.each(function () {
            if (!$.data(this, "plugin_" + pluginName)) {
                var plugin = new Plugin( this, options );
                $.data(this, "plugin_" + pluginName,
                plugin);
            }else{
                //UPDATE options
                var plugin = $.data(this, "plugin_" + pluginName);
                plugin.options = $.extend(true, {}, plugin.options, options);
                plugin.init();
            }
        });
    };

})( jQuery, window, document );
