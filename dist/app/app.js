/**
 * Created by jf on 2015/9/11.
 * Modified by bear on 2016/9/7.
 */
$(function () {
    var pageManager = {
        $container: $('#container'),
        _pageStack: [],
        _configs: [],
        _pageAppend: function(){},
        _defaultPage: null,
        _pageIndex: 1,
        setDefault: function (defaultPage) {
            this._defaultPage = this._find('name', defaultPage);
            return this;
        },
        setPageAppend: function (pageAppend) {
            this._pageAppend = pageAppend;
            return this;
        },
        init: function () {
            var self = this;

            $(window).on('hashchange', function () {
                var state = history.state || {};
                var url = location.hash.indexOf('#') === 0 ? location.hash : '#';
                var page = self._find('url', url) || self._defaultPage;
                if (state._pageIndex <= self._pageIndex || self._findInStack(url)) {
                    self._back(page);
                } else {
                    self._go(page);
                }
            });

            if (history.state && history.state._pageIndex) {
                this._pageIndex = history.state._pageIndex;
            }

            this._pageIndex--;

            var url = location.hash.indexOf('#') === 0 ? location.hash : '#';
            var page = self._find('url', url) || self._defaultPage;
            this._go(page);
            return this;
        },
        push: function (config) {
            this._configs.push(config);
            return this;
        },
        go: function (to) {
            var config = this._find('name', to);
            if (!config) {
                return;
            }
            location.hash = config.url;
        },
        _go: function (config) {
            this._pageIndex ++;

            history.replaceState && history.replaceState({_pageIndex: this._pageIndex}, '', location.href);

            var html = $(config.template).html();
            var $html = $(html).addClass('slideIn').addClass(config.name);
            $html.on('animationend webkitAnimationEnd', function(){
                $html.removeClass('slideIn').addClass('js_show');
            });
            this.$container.append($html);
            this._pageAppend.call(this, $html);
            this._pageStack.push({
                config: config,
                dom: $html
            });

            if (!config.isBind) {
                this._bind(config);
            }

            return this;
        },
        back: function () {
            history.back();
        },
        _back: function (config) {
            this._pageIndex --;

            var stack = this._pageStack.pop();
            if (!stack) {
                return;
            }

            var url = location.hash.indexOf('#') === 0 ? location.hash : '#';
            var found = this._findInStack(url);
            if (!found) {
                var html = $(config.template).html();
                var $html = $(html).addClass('js_show').addClass(config.name);
                $html.insertBefore(stack.dom);

                if (!config.isBind) {
                    this._bind(config);
                }

                this._pageStack.push({
                    config: config,
                    dom: $html
                });
            }

            stack.dom.addClass('slideOut').on('animationend webkitAnimationEnd', function () {
                stack.dom.remove();
            });

            return this;
        },
        _findInStack: function (url) {
            var found = null;
            for(var i = 0, len = this._pageStack.length; i < len; i++){
                var stack = this._pageStack[i];
                if (stack.config.url === url) {
                    found = stack;
                    break;
                }
            }
            return found;
        },
        _find: function (key, value) {
            var page = null;
            for (var i = 0, len = this._configs.length; i < len; i++) {
                if (this._configs[i][key] === value) {
                    page = this._configs[i];
                    break;
                }
            }
            return page;
        },
        _bind: function (page) {
            var events = page.events || {};
            for (var t in events) {
                for (var type in events[t]) {
                    this.$container.on(type, t, events[t][type]);
                }
            }
            page.isBind = true;
        }
    };

    function fastClick(){
        var supportTouch = function(){
            try {
                document.createEvent("TouchEvent");
                return true;
            } catch (e) {
                return false;
            }
        }();
        var _old$On = $.fn.on;

        $.fn.on = function(){
            if(/click/.test(arguments[0]) && typeof arguments[1] == 'function' && supportTouch){ // 只扩展支持touch的当前元素的click事件
                var touchStartY, callback = arguments[1];
                _old$On.apply(this, ['touchstart', function(e){
                    touchStartY = e.changedTouches[0].clientY;
                }]);
                _old$On.apply(this, ['touchend', function(e){
                    if (Math.abs(e.changedTouches[0].clientY - touchStartY) > 10) return;

                    e.preventDefault();
                    callback.apply(this, [e]);
                }]);
            }else{
                _old$On.apply(this, arguments);
            }
            return this;
        };
    }
    function preload(){
        $(window).on("load", function(){
            var imgList = [
                "./images/layers/content.png",
                "./images/layers/navigation.png",
                "./images/layers/popout.png",
                "./images/layers/transparent.gif"
            ];
            for (var i = 0, len = imgList.length; i < len; ++i) {
                new Image().src = imgList[i];
            }
        });
    }
    function androidInputBugFix(){
        // .container 设置了 overflow 属性, 导致 Android 手机下输入框获取焦点时, 输入法挡住输入框的 bug
        // 相关 issue: https://github.com/weui/weui/issues/15
        // 解决方法:
        // 0. .container 去掉 overflow 属性, 但此 demo 下会引发别的问题
        // 1. 参考 http://stackoverflow.com/questions/23757345/android-does-not-correctly-scroll-on-input-focus-if-not-body-element
        //    Android 手机下, input 或 textarea 元素聚焦时, 主动滚一把
        if (/Android/gi.test(navigator.userAgent)) {
            window.addEventListener('resize', function () {
                if (document.activeElement.tagName == 'INPUT' || document.activeElement.tagName == 'TEXTAREA') {
                    window.setTimeout(function () {
                        document.activeElement.scrollIntoViewIfNeeded();
                    }, 0);
                }
            })
        }
    }
    function setJSAPI(){
        var option = {
            title: 'WeUI, 为微信 Web 服务量身设计',
            desc: 'WeUI, 为微信 Web 服务量身设计',
            link: "https://weui.io",
            imgUrl: 'https://mmbiz.qpic.cn/mmemoticon/ajNVdqHZLLA16apETUPXh9Q5GLpSic7lGuiaic0jqMt4UY8P4KHSBpEWgM7uMlbxxnVR7596b3NPjUfwg7cFbfCtA/0'
        };

        $.getJSON('https://weui.io/api/sign?url=' + encodeURIComponent(location.href.split('#')[0]), function (res) {
            wx.config({
                beta: true,
                debug: false,
                appId: res.appid,
                timestamp: res.timestamp,
                nonceStr: res.nonceStr,
                signature: res.signature,
                jsApiList: [
                    'onMenuShareTimeline',
                    'onMenuShareAppMessage',
                    'onMenuShareQQ',
                    'onMenuShareWeibo',
                    'onMenuShareQZone',
                    // 'setNavigationBarColor',
                    'setBounceBackground'
                ]
            });
            wx.ready(function () {
                /*
                 wx.invoke('setNavigationBarColor', {
                 color: '#F8F8F8'
                 });
                 */
                wx.invoke('setBounceBackground', {
                    'backgroundColor': '#F8F8F8',
                    'footerBounceColor' : '#F8F8F8'
                });
                wx.onMenuShareTimeline(option);
                wx.onMenuShareQQ(option);
                wx.onMenuShareAppMessage({
                    title: 'WeUI',
                    desc: '为微信 Web 服务量身设计',
                    link: location.href,
                    imgUrl: 'https://mmbiz.qpic.cn/mmemoticon/ajNVdqHZLLA16apETUPXh9Q5GLpSic7lGuiaic0jqMt4UY8P4KHSBpEWgM7uMlbxxnVR7596b3NPjUfwg7cFbfCtA/0'
                });
            });
        });
    }
    function setPageManager(def){

        def = def || 'page-home';

        var pages = {}, tpls = $('script[type="text/html"]');
        var winH = $(window).height();

        if(tpls.length === 0) {
            return false;
        }

        for (var i = 0, len = tpls.length; i < len; ++i) {
            var tpl = tpls[i], name = tpl.id.replace(/tpl_/, '');
            pages[name] = {
                name: name,
                url: '#' + name,
                template: '#' + tpl.id
            };
        }

        pages[def].url = '#';

        for (var page in pages) {
            pageManager.push(pages[page]);
        }

        pageManager
            .setPageAppend(function($html){
                var $foot = $html.find('.page__ft');
                if($foot.length < 1) return;

                if($foot.position().top + $foot.height() < winH){
                    $foot.addClass('j_bottom');
                }else{
                    $foot.removeClass('j_bottom');
                }
            })
            .setDefault(def)
            .init();
    }

    function init(){
        preload();
        fastClick();
        androidInputBugFix();
        // setJSAPI();
        setPageManager();

        window.pageManager = pageManager;
        window.home = function(){
            location.hash = '';
        };
    }
    init();

    var dndHandlder = function() {

        var postMessageToFather = {

            ctrlClicked: function(c) {
                parent.postMessage({ 'ctrlClicked': c }, "*");
            },

            ctrlToBeAdded: function(c) {
                parent.postMessage({ 'ctrlToBeAdded': c }, "*");
            },

            ctrlUpdated: function(c) {
                parent.postMessage({ 'ctrlUpdated': c }, "*");
            },

            ctrlRemoved: function(c) {
                parent.postMessage({ 'ctrlRemoved': c }, "*");
            },

            pageSelected: function(c) {
                parent.postMessage({ 'pageSelected': c }, "*");
            },

            makeComponentsDraggable: function(c) {
                parent.postMessage({ 'makeComponentsDraggable': c }, "*");
            }

        }

        function dndInitialization (options) {
            var self = this;

            this.rowSelector = options.rowSelector;
            this.comSelector = options.comSelector;
            this.containerSelector = options.containerSelector;
            this.inter = 0;

            this.makeComponentsDraggable();

            this.onDrop();

            this.initEvents({
                onSourceController: function() {
                    // self.makeComponentsDraggable();
                }
            });

        }

        dndInitialization.prototype = {

            initEvents: function(cbs) {

                var self = this;

                window.addEventListener('message', function(evt) {

                    var data = evt.data,

                        evtAction = {

                            componentsDraggable: function() {
                                console.log('===========================sourceController=========================', self.sourceController);
                                cbs.onSourceController();
                            }

                        },

                        eventName = '';

                    for(var key in data) {
                        eventName = key
                    }

                    if(evtAction[eventName]) {
                        data = data[key];
                        evtAction[eventName]();
                    }

                });

            },

            makeComponentsDraggable: function(cb) {
                var self = this;

                postMessageToFather.makeComponentsDraggable({
                    rowSelector: self.rowSelector
                })
            },

            onDrop: function() {
                var self = this;
                $(this.containerSelector).on("drop", function(e) {
                    console.log('onrop=======', e, currentRoute);

                    if(e.originalEvent.dataTransfer.getData("Text") == 'true') {
                        return false;
                    }

                    var dropTarget = $(e.target),
                        currentRouterDom = $('.' + currentRoute);

                    if(!dropTarget.isChildAndSelfOf('.' + currentRoute)) {
                        parent_window.postMessage({
                            invalidDropArea: true
                        }, '*');
                        return false;
                    }

                    e.preventDefault(); 

                    //获取父元素的window对象上的数据
                    var controller = parent.dndData;
                    parent.currentTarget = e.target;
                    var ctrlAndTarget = {
                        ctrl: controller,
                        target: e.target.id
                    }
                    postMessageToFather.ctrlToBeAdded(ctrlAndTarget);
                    hideDesignerDraggerBorder(dropTarget);
                });
            }

        };

        function appRender(app) {
            parent.postMessage({
                appConfigRender: app
            }, '*');
        }

        function layoutGenerator(data) {
            this.layout = data.layout;
            this.layoutState = data.layoutState;

            this.app = this.layout[0];
            this.pages = this.app.children;

            window.wholeAppConfig = this.app.attr;
            window.layoutState = this.layoutState;

            var PR = new appRender(this.app),
                RG = new routerGenerator(this.pages);

            setPageManager();
        }

        layoutGenerator.prototype = {

            init: function() {

            }

        };

        function pageGenerator() {

        }

        function routerGenerator(pages) {
            this.pages = pages;
            this.init();
        }

        routerGenerator.prototype = {
            init: function() {
                for (var i = 0; i < this.pages.length; i++) {
                    var currentPage = this.pages[i];
                    this.appendPageToHTML(currentPage);
                };
            },

            appendPageToHTML: function(page) {
                var wrapper = $(this.generateTplScript(page.key));
                $('#container').after(wrapper);
                wrapper.append('<div class="page"></div>')
                this.generateTpl(page, wrapper.find('.page'));
            },

            generateTpl: function(page, target) {
                var controllers = page.children;

                for (var i = 0; i < controllers.length; i++) {
                    var ctrl = controllers[i],
                        CG = new ComponentsGenerator({
                            controller: ctrl
                        });

                    var currentElem = CG.createElement();
                    target.append(currentElem);
                };
            },

            generateTplScript: function(id) {
                var wrapper = '<script type="text/html" id="' + id + '"></script>';
                return wrapper;
            }
        };

        function ComponentsGenerator(params) {

            params.initElem = params.initElem || false;

            this.controller = params.controller;

            this.tag = typeof this.controller.tag == 'object' ? this.controller.tag[0] : this.controller.tag;

            this.elemLoaded = false;
            this.refresh = false;


            if(!this.tag) {
                alert('组件数据结构出错');
                return false;
            }

            if(params.initElem) {
                this.initElem();
            }

            return this;
        }

        ComponentsGenerator.prototype = {

            initElem: function() {

                if(!this.elemLoaded) {
                    var docCtrl = $('#' + this.controller.key);

                    this.elem = docCtrl.length > 0 ? docCtrl : $(document.createElement(this.tag));
                    this.elemLoaded = true;
                    this.refresh = docCtrl.length > 0;
                }

                return this.elem;
            },

            bindData: function() {

                this.initElem();

                this.elem.data('controller', JSON.stringify(this.controller));
                this.elem.data('is-controller', true);
            },

            setAttribute: function() {

                this.initElem();

                for(var att in this.controller.attr) {
                    var currentAttr = this.controller.attr[att];

                    if(currentAttr.isClassName) {
                        //更改的属性有css，则需要进行css操作

                        if(this.refresh) {
                            var isClsInVal = false;
                            for (var i = 0; i < currentAttr.value.length; i++) {
                                var currentAttrVal = currentAttr.value[i];

                                if(currentAttrVal == currentAttr._value) {
                                    isClsInVal = true;
                                    break;
                                }
                            };1

                            if(isClsInVal && currentAttr.isNoConflict) {
                                // 不是添加控件而是刷新控件, 先重置为基本class再加新class
                                this.elem.attr('class', this.controller.baseClassName);
                            }
                        }

                        if(currentAttr.isSetAttribute) {
                            //对于某些控件既需要css，也需要attribute属性，比如禁止状态的按钮，需要disabled属性和css类
                            this.elem.attr(att, currentAttr._value);

                            //禁止按钮特殊处理
                            if(currentAttr._value) {
                                for (var j = 0; j < currentAttr.value.length; j++) {
                                    var currentDisabledCSS = currentAttr.value[j];
                                    this.elem.addClass(currentDisabledCSS);
                                };
                            }

                            if(!currentAttr._value) {
                                for (var j = 0; j < currentAttr.value.length; j++) {
                                    var currentDisabledCSS = currentAttr.value[j];
                                    this.elem.removeClass(currentDisabledCSS);
                                };
                            }

                        }

                        if(currentAttr.isSingleToggleClass) {
                            //针对某些对一个类进行开关的属性

                            if(currentAttr._value) {
                                for (var j = 0; j < currentAttr.value.length; j++) {
                                    var currentDisabledCSS = currentAttr.value[j];
                                    this.elem.addClass(currentDisabledCSS);
                                };
                            }else {
                                for (var j = 0; j < currentAttr.value.length; j++) {
                                    var currentDisabledCSS = currentAttr.value[j];
                                    this.elem.removeClass(currentDisabledCSS);
                                };                          
                            }
                        }

                        this.elem.addClass(currentAttr._value);
                    }

                    if(currentAttr.isSetAttribute) {
                        if (currentAttr.isContrary) {
                            this.elem.attr(att,!currentAttr._value);
                        }else {
                            this.elem.attr(att,currentAttr._value);
                        }
                    }

                    if(currentAttr.isHTML) {
                        this.elem.html(currentAttr._value);
                    }

                    //设置容器的默认高度等
                    if (currentAttr.isStyle) {
                        this.elem.css(att, currentAttr._value);
                    }

                    if (currentAttr.isBoundToId) {
                        //一些label获取id
                        var id = '';
                        var getRadioInputId = function (controller) {
                            console.log('hahahahahahahahahahahahah', controller)
                            console.log('hahahahahahahahahahahahah', typeof controller.children)
                            for(var i = 0; i < controller.children.length; i ++) {
                                if (controller.children[i].type == currentAttr.bindType) {
                                    id = controller.children[i].key;
                                    break;
                                }
                                if (typeof controller.children[i].children != 'undefined') {
                                    getRadioInputId(controller.children[i]);
                                }
                            }
                            return id;
                        }
                        this.elem.attr(att, getRadioInputId(this.controller));
                    }

                    if (currentAttr.isRander == true) {
                        //针对某些子组件要不要渲染的情况，如页脚文字或链接
                        var getRanderObj = function (controller) {
                            console.log(controller)
                            for(var i = 0; i < controller.children.length; i ++) {
                                if (controller.children[i].isRander == att) {
                                    return {
                                        parent: controller,
                                        child: controller.children[i]
                                    };
                                }
                            }
                            if (typeof controller.children[i].children !== 'undefined') {
                                getRanderObj(controller.children[i])
                            }
                        }

                        var obj = getRanderObj(this.controller);
                        console.log(obj)
                        if (!currentAttr._value) {
                            obj.parent.children.splice(obj.child, 1);
                        }
                    }

                }

                this.elem.attr('id', this.controller.key);

                return this.elem;
            },

            createElement: function() {
                console.log('createElement', this.controller);

                this.initElem();

                if(this.controller.baseClassName) {
                    this.elem.addClass(this.controller.baseClassName);
                }

                this.setAttribute();
                this.bindData();

                var component = this.elem;

                if(this.controller.children && this.controller.children.length > 0) {

                    for (var i = 0; i < this.controller.children.length; i++) {
                        var currentCtrl = this.controller.children[i],

                            reComGenerator = new ComponentsGenerator({
                                controller: currentCtrl
                            }),

                            loopComponent = reComGenerator.createElement(),

                            jqComponent = $(component);

                        jqComponent.append($(loopComponent));

                    };

                }

                this.makeElemAddedDraggable();

                return component;
            },

            makeElemAddedDraggable: function() {
                var orginClientX, orginClientY, movingClientX, movingClientY,

                    elem = this.elem;

                elem.attr('draggable', true);

                elem.on('dragstart', function (e) {
                    console.log(e)
                    window.dragElement = $(e.currentTarget);
                    if(window.dragElement.hasClass('hight-light')) {
                        orginClientX = e.clientX;
                        orginClientY = e.clientY;

                        e.originalEvent.dataTransfer.setData('Text','true');
                        $(e.currentTarget).css('opacity','.3');
                    }

                });

                elem.on('drag',function (e) {

                    // if(this.dragElement.hasClass('hight-light')) {

                        movingClientX = e.clientX;
                        movingClientY = e.clientY;
                        if(elem.position().top + orginClientY - movingClientY <= 42){
                            console.log('}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}非法位置')
                        }
                        // direction = orginClientY,movingClientY - orginClientY;

                    // }

                });

                elem.on('dragenter', function (e) {
                    console.log('进入',e)
                })
            
                elem.on('dragleave', function (e) {
                    console.log('离开')
                    // if(this.dragElement.hasClass('hight-light')) {
                        $this = $(e.currentTarget);
                        hideDesignerDraggerBorder($this);
                        if($this.eq(0).attr('id') != window.dragElement.eq(0).attr('id')){
                            $this.before(window.dragElement);
                        }                   
                    // }

                })

                elem.on('dragend', function (e) {

                    // if(this.dragElement.hasClass('hight-light')) {
                        console.log('拖拽结束：＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝',e);
                        $(e.currentTarget).css('opacity','1');

                        postMessageToFather.ctrlUpdated({
                            params: {
                                key: ''
                            }
                        });
                    // }

                });
            }

        }


        var evtHandler = function() {

            window.addEventListener("message", function (evt) {

                var data = evt.data,
                    eventName = '',

                    evtAction = {

                        layoutLoaded: function() {
                            console.log('previewer layoutLoaded', data);
                            var LG = new layoutGenerator(data);

                            var dnd = new dndInitialization({
                                rowSelector: '#dnd-row',
                                comSelector: '.app-components',
                                containerSelector: '.container'
                            });
                        },

                        pageAdded: function() {

                        },

                        pageUpdated: function() {

                        },

                        pageRemoved: function() {

                        },

                        pageSelected: function() {

                        },

                        ctrlAdded: function() {

                        },

                        ctrlRemoved: function() {

                        },

                        ctrlUpdated: function() {

                        },

                        ctrlSelected: function() {

                        }
                    };

                for(var key in data) {
                    eventName = key
                }

                if(evtAction[eventName]) {
                    console.log('key', data[key]);
                    data = data[key];
                    evtAction[eventName]();
                }
            });

        }();

    }();
});