/*!***************************************************
 * jchanzi.js v3.4.0
 * Browser support: Firefox >= 4, Chromium >= 4
 * Homepage: https://jicheng.tw/hanzi
 * Copyright (c) 2010-2024, Danny Lin
 * Released under MIT license
 *****************************************************/

/*! https://mths.be/codepointat v0.2.0 by @mathias */
if (!String.prototype.codePointAt) {
  (function() {
    'use strict'; // needed to support `apply`/`call` with `undefined`/`null`
    var defineProperty = (function() {
      // IE 8 only supports `Object.defineProperty` on DOM elements
      try {
        var object = {};
        var $defineProperty = Object.defineProperty;
        var result = $defineProperty(object, object, object) && $defineProperty;
      } catch(error) {}
      return result;
    }());
    var codePointAt = function(position) {
      if (this == null) {
        throw TypeError();
      }
      var string = String(this);
      var size = string.length;
      // `ToInteger`
      var index = position ? Number(position) : 0;
      if (index != index) { // better `isNaN`
        index = 0;
      }
      // Account for out-of-bounds indices:
      if (index < 0 || index >= size) {
        return undefined;
      }
      // Get the first code unit
      var first = string.charCodeAt(index);
      var second;
      if ( // check if it�䏭 the start of a surrogate pair
        first >= 0xD800 && first <= 0xDBFF && // high surrogate
        size > index + 1 // there is a next code unit
      ) {
        second = string.charCodeAt(index + 1);
        if (second >= 0xDC00 && second <= 0xDFFF) { // low surrogate
          // https://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
          return (first - 0xD800) * 0x400 + second - 0xDC00 + 0x10000;
        }
      }
      return first;
    };
    if (defineProperty) {
      defineProperty(String.prototype, 'codePointAt', {
        'value': codePointAt,
        'configurable': true,
        'writable': true
      });
    } else {
      String.prototype.codePointAt = codePointAt;
    }
  }());
}

(function (root, factory) {
  // Browser globals
  root.jchanzi = factory(root);
}(this, function (window) {
  "use strict";

  var document = window.document;

  var _jc = window.jchanzi;
  var jc = {};

  var conf = {
    api: (window.location.protocol === "https:" ? "https:" : "http:") + '//jicheng.tw/hanzi/',
    autoProcess: true, // �䲰���𢒰頛匧�亙�峕�鞉���𤥁�匧�交迨�單𧋦���䌊��閗�㗇��
    imageAutoResize: true, // �鍂 CSS 撠��𣇉��之撠讐葬�𦆮�箏�峕���𦯀�璅�
    imageSize: 40, // in pixels, or negative for auto
    imageSizeMin: 40, // in pixels
    imageSizeMax: 120, // in pixels
    fontColor: "auto", // RRGGBBAA, or "auto" for auto
    fontName: "", // "m" (���), "k" (璆�), "s" (摰�), or falsy for database default
    bgColor: "transparent",
    linkInfo: true, // 頧㗇�𤤿���𣇉���牐�𦠜䰻閰ａ����
    convertEntity: false, // 頧㗇�� &C+15984; &CDP-88EE; &VS-1; 蝑� "entities"
    convertIds: true, // 頧㗇�� IDS 蝯�摮�
    convertIdsDynamic: 1, // 0: 銝滢蝙�鍂��閙�讠�摮�, 1: �𪄳銝滚�摮埈�雿輻鍂, 2: 蝮賣糓雿輻鍂
    convertIdsDynamicAdvanced: 1, // 0: 銝滨�����滚�𢠃�滨�𠰴��, 1: 銝滨���滨�𠰴��, 2: �賜�
    convertIdsDynamicSize: 100, // in pixels, or negative for auto
    convertCdp: false, // 頧㗇�𥟇慰摮埈�见耦鞈��坔澈瑽见�堒�誩�𦠜�见�㛖泵���
    convertUnicode: 3, // 1: ExtB+, 2: ��� ExtA, 3: ��惩熒�䠷�券�硔��蝑���摮堒��
    convertUnicodeDisplayable: false, // 蝚血�� convertUnicode ��摮堒���朖雿輻�讛汗�膥�虾憿舐內銋蠘�㗇��
    convertUdc: false // "CDP", "CZ", or falsy to disable
  };

  if (_jc && _jc.conf) {
    for (var i in _jc.conf) {
      conf[i] = _jc.conf[i];
    }
  }

  jc.conf = conf;

  jc.processPage = function () {
    jc.processElement(document.body);
  };

  jc.processElement = function (elem) {
    if (!elem) return;

    var convertEntity = conf.convertEntity;
    var regexExclude = /[ \t\v\r\n\f]/;
    var regexIdsComposite = /([\uD800-\uDBFF][\uDC00-\uDFFF]|[\s\S])(?:[\uFE00-\uFE0F]|[\uDB40][\uDD00-\uDDEF])?/g;
    var regexIdsUdc = /^(?:[\uE000-\uF8FF]|[\uDB80-\uDBFF][\uDC00-\uDFFF])/;
    var regex = makeRegex(conf);
    var pendingReplacements = [];

    var e = [elem];  // 敺���閧��腼��梹�𣬚眏敺����㵪��0-based
    var i = 0, el;
    do {
      el = e[i];
      if (el.nodeType === 1) {  // element
        var nodename = el.nodeName.toLowerCase();
        if (nodename === 'frame' || nodename === 'iframe') {
          try {
            jc.processElement(el.contentDocument.body);
          } catch(ex) {
            console.error(ex);
          }
        } else if (nodename !== "script" && nodename !== "style" && nodename !== "textarea" && !el.getAttribute('data-jchanzi') ) {
          var c = el.childNodes, j = c.length;
          while(j) { e[i++] = c[--j]; }
        }
      } else if (el.nodeType === 3) {  // text
        processElementText(el);
      }
    } while (i--);

    doReplacements();

    function makeRegex(conf) {
      /* 蝚��� Entity, \1 */
      if (conf.convertEntity) {
        var regex1 = "&([A-Za-z][0-9A-Za-z]*[+-]+[0-9A-Za-z_+-]+);";
      } else {
        var regex1 = "(^(?!))";
      }

      /* IDS, \2 */
      if (conf.convertIds) {
        var regex2 = "([\\u2FF0-\\u2FFF\\u31EF])";
      } else {
        var regex2 = "(^(?!))";
      }

      /* CDP, \3 */
      /**
       * [0xF6A3, 0xF6A4, 0xF6A5] 銝𠹺��, 撌血𢰧, ���鉄
       * [0xF6A6, 0xF6A7, 0xF6A8, 0xF6A9, 0xF6AA, 0xF6AB, 0xF6AC, 0xF6AD] ��滩�摮堒��
       * [0xF6AE, 0xF6AF] [敶兡, [�吞
       * [0xF6B0, 0xF6B1] [嚗篏, [擃瑺
       */
      if (conf.convertCdp) {
        var regex3 = [
          "(?:[\\uF6A6-\\uF6AD]?[^\\uF6A3-\\uF6AF])(?:[\\uF6A3-\\uF6A5](?:[\\uF6A6-\\uF6AD]?[^\\uF6A3-\\uF6AF]))+",
          "[\\uF6A6-\\uF6AD][^\\uF6A3-\\uF6AF]",
          "\\uF6AE(?:[\\uF6A6-\\uF6AD]?[^\\uF6A3-\\uF6AF])+\\uF6AF",
          "[\\uF6A3-\\uF6B1]"
          ];
        regex3 = '(' + regex3.join('|') + ')';
      } else {
        var regex3 = "(^(?!))";
      }

      /* Unicode, \4 */
      /**
       * javascript �� 0x10000 隞乩�羓�摮埈�頧㗇�� UTF-16 ����嗘�滚���聢撘�
       * 頛𥪜𨭌嚗�2E80-2EFF �券�𤥁�𨅯��嚗�2F00-2FDF ��摨瑞�䠷�券�吔��31C0-31EF 蝑����楲��
       * ExtB+嚗�20000(D840 DC00)-3FFFF(D8BF DFFF)
       */
      var regex4 = [];
      switch (conf.convertUnicode) {
        case 3:
          regex4.push("[\\u2E80-\\u2EFF\\u2F00-\\u2FDF\\u31C0-\\u31EF]");  // 銝剜𠯫��㯄�券�𤥁�𨅯��, 摨瑞�䠷�券��, 銝剜𠯫��梶��𧞄
        case 2:
          regex4.push("[\\u3400-\\u4DBF]");  // Ext-A
        case 1:
          regex4.push("[\\u9FA6-\\u9FFF]");  // 銝剜𠯫��梶絞銝�銵冽�𤩺���� (Unicode >= 4.1)
          regex4.push("[\\uD840-\\uD8BF][\\uDC00-\\uDFFF]");  // Ext-B+
        // 0: �賭�滩�閧�
      }
      if (regex4.length) {
        regex4 = [
          '(',
          '(?:' + regex4.join('|') + ')',
          '(?:[\\uFE00-\\uFE0F]|[\\uDB40][\\uDD00-\\uDDEF])?',  // optional variation selector
          ')'
        ].join('');
      } else {
        regex4 = "(^(?!))";
      }

      /* �惩��, \5 */
      /**
       * �惩�梹�鍃000-F8FF; F0000-FFFFF + 100000-10FFFF -> DB80 DC00 - DBFF DFFF (���𣬚���滚虾���蔥)
       */
      var regex5 = [];
      if (conf.convertUdc) {
        var regex5 = "([\\uE000-\\uF8FF]|[\\uDB80-\\uDBFF][\\uDC00-\\uDFFF])";
      } else {
        var regex5 = "(^(?!))";
      }

      /* merge regex# */
      var regex = new RegExp([regex1, regex2, regex3, regex4, regex5].join('|'), 'g');

      return regex;
    }

    function processElementText(elem) {
      var curObj = elem, parentObj = elem.parentNode, newObj, nextObj;
      var replacements = [];
      var frag;
      var s = curObj.nodeValue;
      regex.lastIndex = 0;
      var m = regex.exec(s);
      while (m) {
        if (m[2]) {  // 甇斤�截DC嚗𣬚鸌畾𠰴�菜葫��閧�IDS
          var replaceStart = regex.lastIndex - m[0].length;
          var replaceLen = detectIdsLen(s, replaceStart, convertEntity);
          var replaceEnd = replaceStart + replaceLen;
          regex.lastIndex = replaceEnd;
          m[0] = m[2] = s.substring(replaceStart, replaceEnd);
          if (m[2].length === replaceLen && !regexExclude.test(m[2])) {
            var newObj = processElementTextReplaced(m, getComputedStyle);
          }
        } else {
          var replaceEnd = regex.lastIndex;
          var replaceLen = m[0].length;
          var replaceStart = replaceEnd - replaceLen;
          var newObj = processElementTextReplaced(m, getComputedStyle);
        }

        if (newObj) {
          replacements.push({
            node: newObj,
            start: replaceStart,
            end: replaceEnd
          });
        }
        m = regex.exec(s);
      }

      if (replacements.length) {
        pendingReplacements.push({
          textNode: elem,
          replacements: replacements
        });
      }

      function getComputedStyle(prop) {
        if (getComputedStyle.fn) {
          return getComputedStyle.fn(prop);
        }
        if (typeof window.getComputedStyle !== 'undefined') {
          var cache = window.getComputedStyle(parentObj, null);
          var fn = getComputedStyle.fn = function (prop) {
            return cache.getPropertyValue(prop);
          };
        } else {
          var cache = parentObj.currentStyle;
          var parent = parentObj;
          var fn = getComputedStyle.fn = function (prop) {
            if (prop === 'color') {
              var range = document.body.createTextRange();
              range.moveToElementText(parent);
              var color = range.queryCommandValue("foreColor");
              return "rgb(" + (color & 0xFF) + "," + ((color & 0xFF00) >> 8) + "," + ((color & 0xFF0000) >> 16) + ")";
            }
            return cache[prop];
          };
        }
        return fn(prop);
      }
    }

    function processElementTextReplaced(m, getComputedStyle) {
      var imgurl;
      var lnkurl;
      var chr;
      var alt;

      var getImgSize = function () {
        if (conf.imageSize >= 0) {
          return conf.imageSize;
        }

        try {
          var computedSize = getComputedStyle("font-size");
          computedSize = parseInt(computedSize, 10);
          return Math.min(conf.imageSizeMax, Math.max(conf.imageSizeMin, computedSize));
        } catch (ex) {
          // failed to get computed size (element hidden etc.), use min instead
          return conf.imageSizeMin;
        }
      };

      var getDynamicImgSize = function () {
        if (conf.convertIdsDynamicSize >= 0) {
          return conf.convertIdsDynamicSize;
        }

        try {
          var computedSize = getComputedStyle("font-size");
          computedSize = parseInt(computedSize, 10);
          return Math.min(conf.imageSizeMax, Math.max(conf.imageSizeMin, computedSize));
        } catch (ex) {
          // failed to get computed size (element hidden etc.), use min instead
          return conf.imageSizeMin;
        }
      };

      var getFontColor = function () {
        if (conf.fontColor !== 'auto') {
          return conf.fontColor;
        }
        try {
          var computedColor = getComputedStyle("color");
          if (/rgb\((\d+),\s*(\d+),\s*(\d+)\)/i.test(computedColor)) {
            var r = parseInt(RegExp.$1, 10).toString(16).toUpperCase(); if (r.length < 2) { r = '0' + r; }
            var g = parseInt(RegExp.$2, 10).toString(16).toUpperCase(); if (g.length < 2) { g = '0' + g; }
            var b = parseInt(RegExp.$3, 10).toString(16).toUpperCase(); if (b.length < 2) { b = '0' + b; }
            var color = r + g + b + 'FF';
            return color;
          }
        } catch (ex) {
          console.error(ex);
        }
        return '000000FF';
      };

      if (m[1]) {
        chr = encodeURIComponent(m[0]);
        alt = m[1];
        
      } else if (m[2]) {
        /*
        if (conf.convertIdsDynamic === 2) {
          // ��閙�讠�摮�
          var dataUrl = dynamicChar.generate(
            m[0],
            getDynamicImgSize(),
            getComputedStyle("color"),
            getComputedStyle("font-family"),
            getComputedStyle("font-weight"),
            getComputedStyle("font-style")
          );
          if (dataUrl) {
            imgurl = dataUrl;
          }
        }
        chr = encodeURIComponent(m[0]);
        alt = m[0];
        */
       var dataUrl = dynamicChar.generate(
        m[0],
        getDynamicImgSize(),
        getComputedStyle("color"),
        getComputedStyle("font-family"),
        getComputedStyle("font-weight"),
        getComputedStyle("font-style")
    );
    if (dataUrl) {
        imgurl = dataUrl;
        lnkurl = imgurl;          // harmless link (data URL)
    } else {
        // If dynamic rendering fails, leave the original IDS text in place
        return null;
    }
    chr = encodeURIComponent(m[0]);
    alt = m[0];
      } else if (m[3]) {
        var gzs = encodeURIComponent(m[0]);
        var gzs2 = gzs;
        alt = m[0];

        if (/^\uF6AE(.+?)\uF6B1(.+?)(?:;([0-9]+))?\uF6AF$/.test(m[0])) {
          // 憸冽聢蝣� => �㺿�䰻閰Ｘ𧋦摮�
          gzs2 = RegExp.$1;
        }

        imgurl = conf.api + 'drawcdp' + '?gzs=' + gzs + '&f=' + conf.fontName + '&s=' + getImgSize() + '&c=' + getFontColor();
        lnkurl = conf.linkInfo ? conf.api + 'search' + '?gzs=' + gzs2 : imgurl;
      } else if (m[4]) {
        if (!conf.convertUnicodeDisplayable && jc.charDisplayable(m[0])) {
          // �讛汗�膥�虾憿舐內��摮堒�� => 銝滩�㗇��
          return null;
        }
        chr = encodeURIComponent(m[0]);
        alt = m[0];
      } else if (m[5]) {
        // �惩�堒�堒�� => ���烐���𡁶��惩�烾�
        var code = m[0].codePointAt(0);
        switch (conf.convertUdc) {
          case "CDP":
            code = dechex(unicode_pua_to_big5(code));
            chr = '&CDP-' + code + ';';
            alt = 'CDP-' + code;
            break;
          case "CZ":
            code = dechex(unicode_pua_to_big5(code));
            chr = '&CZ-' + code + ';';
            alt = 'CZ-' + code;
            break;
          default:
            code = dechex(code);
            chr = m[0];
            alt = 'U+' + code;
            break;
        }
        chr = encodeURIComponent(chr);
      }

      // 撱箇�见�𣇉���屸����
      if (!imgurl) {
        imgurl = conf.api + 'draw' + '?char=' + chr + '&f=' + conf.fontName + '&s=' + getImgSize() + '&c=' + getFontColor();
      }
      if (!lnkurl) {
        lnkurl = conf.linkInfo ? conf.api + 'search' + '?c=' + chr + '&e=char' : imgurl;
        if (lnkurl.slice(0, 5) === 'data:') { lnkurl = null; }
      }

      var lnk = document.createElement('A');
      if (lnkurl) { lnk.href = lnkurl; }
      lnk.target = "_blank";
      lnk.setAttribute('data-jchanzi', m[0]);
      lnk.title = alt;
      var img = lnk.appendChild(document.createElement('IMG'));
      img.onerror = function (event) {
        if (m[2] && conf.convertIdsDynamic === 1) {
          var dataUrl = dynamicChar.generate(
            decodeURIComponent(chr),
            getDynamicImgSize(),
            getComputedStyle("color"),
            getComputedStyle("font-family"),
            getComputedStyle("font-weight"),
            getComputedStyle("font-style")
          );
          if (dataUrl) {
            img.onerror = null;
            img.src = dataUrl;
            lnk.removeAttribute('href');
            return;
          }
        }
        console.error("Unable to load char image from: " + img.src, lnk);

        var frag = document.createDocumentFragment();
        lnk.getAttribute('data-jchanzi').replace(
          regexIdsComposite,
          function (m) {
            if (!jc.charDisplayable(m) && !regexIdsUdc.test(m)) {
              var img = document.createElement('IMG');
              img.src = conf.api + 'draw' + '?char=' + encodeURIComponent(m) + '&f=' + conf.fontName + '&s=' + getImgSize() + '&c=' + getFontColor();
              img.alt = m;
              if (conf.imageAutoResize) { img.style.width = img.style.height = '1em'; }
              img.style.border = 'none';
              img.style.verticalAlign = 'text-bottom';
              img.style.backgroundColor = conf.bgColor;
              frag.appendChild(img);
              return;
            }
            frag.appendChild(document.createTextNode(m));
          }
        );
        frag.normalize();

        lnk.replaceChild(frag, img);
        lnk.removeAttribute('href');
      };
      img.src = imgurl;
      img.alt = alt;
      if (conf.imageAutoResize) { img.style.width = img.style.height = '1em'; }
      img.style.border = 'none';
      img.style.verticalAlign = 'text-bottom';
      img.style.backgroundColor = conf.bgColor;
      return lnk;
    }

    function doReplacements() {
      for (var i = pendingReplacements.length; i--;) {
        var textNode = pendingReplacements[i].textNode;
        var frag = document.createDocumentFragment();
        var curNode = frag.appendChild(textNode.cloneNode(false));
        for (var j = pendingReplacements[i].replacements.length; j--;) {
          var replacement = pendingReplacements[i].replacements[j];
          if (curNode.nodeValue.length > replacement.end) {
            curNode.splitText(replacement.end);  // Y = X.splitText(index) ����� X ����𣂷���� node嚗�嘑銵��� X �箏�漤𢒰��嚗磤 �箏�屸𢒰��
          }
          var middle = curNode.splitText(replacement.start);
          curNode.parentNode.replaceChild(replacement.node, middle);
        }
        textNode.parentNode.replaceChild(frag, textNode);
      }
    }
  };

  /**
   * @deprecated since version 3.0
   */
  jc.processObject = jc.processElement;

  jc.unprocessPage = function () {
    jc.unprocessElement(document.body);
  };

  jc.unprocessElement = function (elem) {
    // ��閧�����
    var els = elem.getElementsByTagName('A'), i = els.length, I, el, els1, pre, post, content;
    while (i--) {
      el = els[i];
      content = el.getAttribute('data-jchanzi');
      if (content) {
        pre = el.previousSibling;
        post = el.nextSibling;
        if (pre && pre.nodeType === 3) {
          content = pre.nodeValue + content;
          pre.parentNode.removeChild(pre);
        }
        if (post && post.nodeType === 3) {
          content = content + post.nodeValue;
          post.parentNode.removeChild(post);
        }
        el.parentNode.replaceChild(document.createTextNode(content) , el);
      }
    }
    elem.normalize();

    // ��閧���獢�
    els = [];
    els1 = elem.getElementsByTagName('FRAME');
    for (i=0, I = els1.length; i < I; ++i) {
      els.push(els1[i]);
    }
    els1 = elem.getElementsByTagName('IFRAME');
    for (i=0, I = els1.length; i < I; ++i) {
      els.push(els1[i]);
    }
    for (i=0, I = els.length; i < I; ++i) {
      el = els[i];
      try {
        jc.unprocessElement(el.contentDocument.body);
      } catch(ex) {
        console.error(ex);
      }
    }
  };

  /**
   * @deprecated since version 3.0
   */
  jc.unprocessObject = jc.unprocessElement;

  jc.charDisplayable = function (txt) {
    var controls =  [
      getData('\uDBFF\uDFFF'), // U+10FFFF
      getData('\uDBBF\uDFFF'), // U+FFFFF
      getData('\uFFFF'),
    ];
    var cache = {};

    // treat IDS operators as displayable
    for (var i = 0x2FF0, I = 0x2FFF; i <= I; i++) {
      cache[String.fromCharCode(i)] = true;
    }
    cache["\u31EF"] = true;

    jc.charDisplayable = charDisplayable;
    return charDisplayable(txt);

    function charDisplayable(txt) {
      if (typeof cache[txt] !== 'undefined') {
        return cache[txt];
      }
      var test = getData(txt);
      cache[txt] = true;
      for (var i = controls.length - 1; i >= 0; --i) {
        if (compare(test.data, controls[i].data)) {
          cache[txt] = false;
          break;
        }
      }
      return cache[txt];
    }

    function getData(txt) {
      var el = document.createElement("canvas");
      el.width = el.height = 10;
      var ctx = el.getContext("2d");
      ctx.textBaseline = "top";
      ctx.fillText(txt, 0, 0);
      return ctx.getImageData(0, 0, 10, 10);
    }

    function compare(obj1, obj2) {
      for (var i = 0, I = 10 * 10 * 4; i < I; ++i) {
        if (obj1[i] !== obj2[i]) { return false; }
      }
      return true;
    }
  };

  var dynamicChar = {
    /* 敺� IDS 摮𦯀葡�㻿��� list */
    fromText: function (text) {
      var list = [];
      for (var i = text.length - 1; i >= 0; --i) {
        var u = text.codePointAt(i);
        switch (u) {
          case 0x2FF0: // 撌血𢰧
            list.unshift([
              {component: list.shift(), xs: 0, xe: 1/2, ys: 0, ye: 1},
              {component: list.shift(), xs: 1/2, xe: 1, ys: 0, ye: 1},
            ]);
            break;
          case 0x2FF1: // 銝𠹺��
            list.unshift([
              {component: list.shift(), xs: 0, xe: 1, ys: 0, ye: 1/2},
              {component: list.shift(), xs: 0, xe: 1, ys: 1/2, ye: 1},
            ]);
            break;
          case 0x2FF2: // 銝匧椰�𢰧
            list.unshift([
              {component: list.shift(), xs: 0, xe: 1/3, ys: 0, ye: 1},
              {component: list.shift(), xs: 1/3, xe: 2/3, ys: 0, ye: 1},
              {component: list.shift(), xs: 2/3, xe: 1, ys: 0, ye: 1},
            ]);
            break;
          case 0x2FF3: // 銝劐�𠹺��
            list.unshift([
              {component: list.shift(), xs: 0, xe: 1, ys: 0, ye: 1/3},
              {component: list.shift(), xs: 0, xe: 1, ys: 1/3, ye: 2/3},
              {component: list.shift(), xs: 0, xe: 1, ys: 2/3, ye: 1},
            ]);
            break;
          case 0x2FF4: // 憭硋��
            list.unshift([
              {component: list.shift(), xs: 0, xe: 1, ys: 0, ye: 1},
              {component: list.shift(), xs: 1/4, xe: 3/4, ys: 1/4, ye: 3/4},
            ]);
            break;
          case 0x2FF5: // 撌虫�𠰴𢰧��
            list.unshift([
              {component: list.shift(), xs: 0, xe: 1, ys: 0, ye: 1},
              {component: list.shift(), xs: 1/4, xe: 3/4, ys: 1/4, ye: 1},
            ]);
            break;
          case 0x2FF6: // 撌虫�见𢰧��
            list.unshift([
              {component: list.shift(), xs: 0, xe: 1, ys: 0, ye: 1},
              {component: list.shift(), xs: 1/4, xe: 3/4, ys: 0, ye: 3/4},
            ]);
            break;
          case 0x2FF7: // 銝𠰴椰銝见�
            list.unshift([
              {component: list.shift(), xs: 0, xe: 1, ys: 0, ye: 1},
              {component: list.shift(), xs: 1/4, xe: 1, ys: 1/4, ye: 3/4},
            ]);
            break;
          case 0x2FF8: // 撌虫�𠰴�
            list.unshift([
              {component: list.shift(), xs: 0, xe: 1, ys: 0, ye: 1},
              {component: list.shift(), xs: 1/4, xe: 1, ys: 1/4, ye: 1},
            ]);
            break;
          case 0x2FF9: // �𢰧銝𠰴�
            list.unshift([
              {component: list.shift(), xs: 0, xe: 1, ys: 0, ye: 1},
              {component: list.shift(), xs: 0, xe: 3/4, ys: 1/4, ye: 1},
            ]);
            break;
          case 0x2FFA: // 撌虫�见�
            list.unshift([
              {component: list.shift(), xs: 0, xe: 1, ys: 0, ye: 1},
              {component: list.shift(), xs: 1/4, xe: 1, ys: 0, ye: 3/4},
            ]);
            break;
          case 0x2FFB: // ��滨��
            list.unshift([
              {component: list.shift(), xs: 0, xe: 1, ys: 0, ye: 1},
              {component: list.shift(), xs: 0, xe: 1, ys: 0, ye: 1},
            ]);
            break;
          case 0x2FFC: // 銝𠰴𢰧銝见�
            list.unshift([
              {component: list.shift(), xs: 0, xe: 1, ys: 0, ye: 1},
              {component: list.shift(), xs: 0, xe: 3/4, ys: 1/4, ye: 3/4},
            ]);
            break;
          case 0x2FFD: // �𢰧銝见�
            list.unshift([
              {component: list.shift(), xs: 0, xe: 1, ys: 0, ye: 1},
              {component: list.shift(), xs: 0, xe: 3/4, ys: 0, ye: 3/4},
            ]);
            break;
          case 0x2FFE: // 撌血𢰧�𨘥��
            list.unshift([
              {component: list.shift(), xs: 1, xe: 0, ys: 0, ye: 1},
            ]);
            break;
          case 0x2FFF: // ��贝��180摨�
            list.unshift([
              {component: list.shift(), xs: 1, xe: 0, ys: 1, ye: 0},
            ]);
            break;
          default: // 銝���摮堒��
            if (u >= 0x10000) {
              // surrogate pair
              list[0] = text[i] + list[0];
            } else {
              list.unshift(text[i]);
            }
            break;
        }
      }
      return list.shift();
    },

    /* 撠� list 頧厩�箇�𡁏�抒�鞉�页�䔶蒂閮��堒�蝯���鞟�雿滨蔭 */
    linearize: function (list) {
      var newlist = [];
      for (var i = 0, I = list.length; i < I; ++i) {
        var item = list[i];
        if (Array.isArray(item.component)) {
          this.linearize(item.component);
          for (var j = 0, J = item.component.length; j < J; ++j) {
            var subitem = item.component[j];
            newlist.push({
              component: subitem.component,
              xs: item.xs + (item.xe - item.xs) * subitem.xs,
              xe: item.xs + (item.xe - item.xs) * subitem.xe,
              ys: item.ys + (item.ye - item.ys) * subitem.ys,
              ye: item.ys + (item.ye - item.ys) * subitem.ye
            });
          }
        } else {
          newlist.push(item);
        }
      }
      list.length = 0;
      for (var i = 0, I = newlist.length; i < I; ++i) {
        list.push(newlist[i]);
      }
      return list;
    },

    /* �覔��𡁜�𦯀葡蝑㕑���羓鼓鋆賜�摮梹���喳�� dataURL */
    generate: function (text, size, color, font, weight, italic) {
      // 撽𡑒�厰�蹱糓�虾�𧞄�� IDS
      for (var i = 0, I = text.length; i < I; ++i) {
        var chr = text[i];
        if (text.codePointAt(i) >= 0x10000) {
          // surrogate pair
          chr += text[i + 1];
          i += 1;
        }
        if (!jc.charDisplayable(chr)) {
          return null;
        }
      }

      if (conf.convertIdsDynamicAdvanced < 1) {
        if (/[\u2FF4-\u2FFF\u31EF]/.test(text)) {
          return null;
        }
      } else if (conf.convertIdsDynamicAdvanced < 2) {
        if (/[\u2FFB\u31EF]/.test(text)) {
          return null;
        }
      } else {
        if (/[\u31EF]/.test(text)) {
          return null;
        }
      }

      // 敹賜裦�㺭擃𥪜�埈�躰��
      text = text.replace(/\u303E/g, '');

      var list = this.fromText(text);
      this.linearize(list);
      return this.draw(list, size, color, font, weight, italic);
    },

    /* �覔��� list 蝜芾ˊ蝯�摮梹���喳�� dataURL */
    draw: function (list, size, color, font, weight, italic) {
      var canv = document.createElement('canvas');
      var ctx = canv.getContext('2d');
      canv.width = canv.height = size;
      ctx.textBaseline = "top";
      ctx.fillStyle = color;
      ctx.font = [italic, weight, '100px', font].join(' ');
      var scale = size / 100;
      for (var i = 0, I = list.length; i < I; ++i) {
        this.drawChar(ctx, scale, list[i]);
      }
      return canv.toDataURL();
    },

    drawChar: function (ctx, scale, item) {
      var chr = item.component;

      // �嵗甇��讐宏嚗�葫摰𡁜�潸���𣂼�𡁜�潔�见榆銋� 1/2嚗�
      var dxs = 0, dxe = 0, dys = 0, dye = 0;
      if (ctx.measureText) {
        var m = ctx.measureText(chr);
        if (m.actualBoundingBoxLeft) {
          dxs = m.actualBoundingBoxLeft / 2 / 100;
        }
        if (m.actualBoundingBoxRight) {
          dxe = (m.actualBoundingBoxRight - 100) / 2 / 100;
        }
        if (m.actualBoundingBoxAscent) {
          dys = m.actualBoundingBoxAscent / 2 / 100;
        }
        if (m.actualBoundingBoxDescent) {
          dye = (m.actualBoundingBoxDescent - 100) / 2 / 100;
        }
      }

      var xs = item.xs - dxs;
      var xe = item.xe - dxe;
      var ys = item.ys - dys;
      var ye = item.ye - dye;
      var x = xe - xs;
      var y = ye - ys;
      ctx.setTransform(x * scale, 0, 0, y * scale, xs * scale * 100, ys * scale * 100);
      ctx.fillText(chr, 0, 0, 100);
    }
  };

  /**
   * 閮��� IDS 蝞堒�讐�撖阡�偦𩑈摨�
   */
  function detectIdsLen(s, start, convertEntity) {
    var total = s.length, i = start, len = 1, u = 0;
    while (len) {
      u = s.codePointAt(i);
      if ((u >= 0x2FF0 && u <= 0x2FF1) || (u >= 0x2FF4 && u <= 0x2FFD)) {
        // IDS binary operator
        len += 2;
      } else if (u >= 0x2FF2 && u <= 0x2FF3) {
        // IDS trinary operator
        len += 3;
      } else if ((u >= 0x2FFE && u <= 0x2FFF) || (u === 0x303E)) {
        // IDS unary operator
        // ideographic Variation Indicator
        len += 1;
      } else {
        if (u === 0x26) {
          if (convertEntity) {
            // ampersand => include an entity sequence if it exists
            var regex = /&[0-9A-Za-z_+-]+;/g;
            regex.lastIndex = i;
            if (regex.test(s)) {
              i = regex.lastIndex - 1;
            }
          }
        } else if (u >= 0x10000) {
          // surrogate pair in javascript => include the second char
          i++;
        }

        if (total > i + 1) { // there is next char
          var n = s.codePointAt(i + 1);
          if (0xFE00 <= n && n <= 0xFE0F) {
            // variation selector in BMP
            i++;
          } else if (0xE0100 <= n && n <= 0xE01EF) {
            // variation selector in SSP => include the second char
            i += 2;
          } else if (n === 0x26) {
            if (convertEntity) {
              // ampersand => include a VS entity sequence if it exists
              var regex = /&VS-[0-9]+;/g;
              regex.lastIndex = i;
              if (regex.test(s)) {
                i = regex.lastIndex - 1;
              }
            }
          }
        }
      }
      i++;
      len--;
    }
    return i - start;
  }

  function unicode_pua_to_big5(code) {
    if (0xE000 <= code && code <= 0xE310) {
      var base = 0xE000;
      var base_high = 0xFA;
    } else if (0xE311 <= code && code <= 0xEEB7) {
      var base = 0xE311;
      var base_high = 0x8E;
    } else if (0xEEB8 <= code && code <= 0xF6B0) {
      var base = 0xEEB8;
      var base_high = 0x81;
    } else if (0xF6B1 <= code && code <= 0xF848) {
      var base = 0xF672;
      var base_high = 0xC6;
    } else {
      return;
    }

    code = code - base;
    var high = Math.floor(code / 157);
    var low = code - high * 157;
    high = high + base_high;
    low = (low <= 0x3E) ? (low + 0x40) : (low + 0x62);
    var big5 = high << 8 | low;
    return big5;
  }

  // Big5       Unicode        閮��堒�� (H/L)
  // FA40-FEFE  U+E000-U+E310  (0xe000 + (157 * (H-0xfa)) + (L<0x80)?(L-0x40):(L-0x62)))
  // 8E40-A0FE  U+E311-U+EEB7  (0xe311 + (157 * (H-0x8e)) + (L<0x80)?(L-0x40):(L-0x62)))
  // 8140-8DFE  U+EEB8-U+F6B0  (0xeeb8 + (157 * (H-0x81)) + (L<0x80)?(L-0x40):(L-0x62)))
  // C6A1-C8FE  U+F6B1-U+F848  (0xf672 + (157 * (H-0xc6)) + (L<0x80)?(L-0x40):(L-0x62)))
  function big5_pua_to_unicode(code) {
    var high = code >> 8;
    var low = code & 0xFF;
    if (0xFA40 <= code && code <= 0xFEFE) {
      var unicode = 0xE000 + (high - 0xFA) * 157 + (low < 0x80 ? low - 0x40 : low - 0x62);
    } else if (0x8E40 <= code && code <= 0xA0FE) {
      var unicode = 0xE311 + (high - 0x8E) * 157 + (low < 0x80 ? low - 0x40 : low - 0x62);
    } else if (0x8140 <= code && code <= 0x8DFE) {
      var unicode = 0xEEB8 + (high - 0x81) * 157 + (low < 0x80 ? low - 0x40 : low - 0x62);
    } else if (0xC6A1 <= code && code <= 0xC8FE) {
      var unicode = 0xF672 + (high - 0xC6) * 157 + (low < 0x80 ? low - 0x40 : low - 0x62);
    }
    return unicode;
  }
  
  function dechex(n) {
    return n.toString(16).toUpperCase();
  }

  function hexdec(hex) {
    return parseInt(hex, 16);
  }

  function registerLoadEvent(win, callback) {
    function onInit(event) {
      if (onInit.done) { return false; }
      onInit.done = true;
      callback(event);
    }

    if (win.document.readyState === 'complete') {
      callback();
    } else {
      win.document.addEventListener("DOMContentLoaded", onInit, false);
      win.addEventListener("load", onInit, false);
    }
  }

  registerLoadEvent(window, function () {
    if (conf.autoProcess) {
      jc.processPage();
    }
  });

  return jc;
}));