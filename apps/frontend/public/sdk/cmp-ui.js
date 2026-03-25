function fm(e, t) {
  for (var n = 0; n < t.length; n++) {
    const r = t[n];
    if (typeof r != "string" && !Array.isArray(r)) {
      for (const o in r)
        if (o !== "default" && !(o in e)) {
          const l = Object.getOwnPropertyDescriptor(r, o);
          l && Object.defineProperty(e, o, l.get ? l : {
            enumerable: !0,
            get: () => r[o]
          });
        }
    }
  }
  return Object.freeze(Object.defineProperty(e, Symbol.toStringTag, { value: "Module" }));
}
function rc(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var oc = { exports: {} }, cl = {}, lc = { exports: {} }, z = {};
/**
 * @license React
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Fr = Symbol.for("react.element"), pm = Symbol.for("react.portal"), mm = Symbol.for("react.fragment"), hm = Symbol.for("react.strict_mode"), vm = Symbol.for("react.profiler"), gm = Symbol.for("react.provider"), ym = Symbol.for("react.context"), wm = Symbol.for("react.forward_ref"), Sm = Symbol.for("react.suspense"), xm = Symbol.for("react.memo"), km = Symbol.for("react.lazy"), Ea = Symbol.iterator;
function Cm(e) {
  return e === null || typeof e != "object" ? null : (e = Ea && e[Ea] || e["@@iterator"], typeof e == "function" ? e : null);
}
var ic = { isMounted: function() {
  return !1;
}, enqueueForceUpdate: function() {
}, enqueueReplaceState: function() {
}, enqueueSetState: function() {
} }, sc = Object.assign, ac = {};
function Un(e, t, n) {
  this.props = e, this.context = t, this.refs = ac, this.updater = n || ic;
}
Un.prototype.isReactComponent = {};
Un.prototype.setState = function(e, t) {
  if (typeof e != "object" && typeof e != "function" && e != null)
    throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");
  this.updater.enqueueSetState(this, e, t, "setState");
};
Un.prototype.forceUpdate = function(e) {
  this.updater.enqueueForceUpdate(this, e, "forceUpdate");
};
function uc() {
}
uc.prototype = Un.prototype;
function ps(e, t, n) {
  this.props = e, this.context = t, this.refs = ac, this.updater = n || ic;
}
var ms = ps.prototype = new uc();
ms.constructor = ps;
sc(ms, Un.prototype);
ms.isPureReactComponent = !0;
var Pa = Array.isArray, cc = Object.prototype.hasOwnProperty, hs = { current: null }, dc = { key: !0, ref: !0, __self: !0, __source: !0 };
function fc(e, t, n) {
  var r, o = {}, l = null, i = null;
  if (t != null)
    for (r in t.ref !== void 0 && (i = t.ref), t.key !== void 0 && (l = "" + t.key), t)
      cc.call(t, r) && !dc.hasOwnProperty(r) && (o[r] = t[r]);
  var s = arguments.length - 2;
  if (s === 1)
    o.children = n;
  else if (1 < s) {
    for (var a = Array(s), u = 0; u < s; u++)
      a[u] = arguments[u + 2];
    o.children = a;
  }
  if (e && e.defaultProps)
    for (r in s = e.defaultProps, s)
      o[r] === void 0 && (o[r] = s[r]);
  return { $$typeof: Fr, type: e, key: l, ref: i, props: o, _owner: hs.current };
}
function Em(e, t) {
  return { $$typeof: Fr, type: e.type, key: t, ref: e.ref, props: e.props, _owner: e._owner };
}
function vs(e) {
  return typeof e == "object" && e !== null && e.$$typeof === Fr;
}
function Pm(e) {
  var t = { "=": "=0", ":": "=2" };
  return "$" + e.replace(/[=:]/g, function(n) {
    return t[n];
  });
}
var Na = /\/+/g;
function Ll(e, t) {
  return typeof e == "object" && e !== null && e.key != null ? Pm("" + e.key) : t.toString(36);
}
function So(e, t, n, r, o) {
  var l = typeof e;
  (l === "undefined" || l === "boolean") && (e = null);
  var i = !1;
  if (e === null)
    i = !0;
  else
    switch (l) {
      case "string":
      case "number":
        i = !0;
        break;
      case "object":
        switch (e.$$typeof) {
          case Fr:
          case pm:
            i = !0;
        }
    }
  if (i)
    return i = e, o = o(i), e = r === "" ? "." + Ll(i, 0) : r, Pa(o) ? (n = "", e != null && (n = e.replace(Na, "$&/") + "/"), So(o, t, n, "", function(u) {
      return u;
    })) : o != null && (vs(o) && (o = Em(o, n + (!o.key || i && i.key === o.key ? "" : ("" + o.key).replace(Na, "$&/") + "/") + e)), t.push(o)), 1;
  if (i = 0, r = r === "" ? "." : r + ":", Pa(e))
    for (var s = 0; s < e.length; s++) {
      l = e[s];
      var a = r + Ll(l, s);
      i += So(l, t, n, a, o);
    }
  else if (a = Cm(e), typeof a == "function")
    for (e = a.call(e), s = 0; !(l = e.next()).done; )
      l = l.value, a = r + Ll(l, s++), i += So(l, t, n, a, o);
  else if (l === "object")
    throw t = String(e), Error("Objects are not valid as a React child (found: " + (t === "[object Object]" ? "object with keys {" + Object.keys(e).join(", ") + "}" : t) + "). If you meant to render a collection of children, use an array instead.");
  return i;
}
function Kr(e, t, n) {
  if (e == null)
    return e;
  var r = [], o = 0;
  return So(e, r, "", "", function(l) {
    return t.call(n, l, o++);
  }), r;
}
function Nm(e) {
  if (e._status === -1) {
    var t = e._result;
    t = t(), t.then(function(n) {
      (e._status === 0 || e._status === -1) && (e._status = 1, e._result = n);
    }, function(n) {
      (e._status === 0 || e._status === -1) && (e._status = 2, e._result = n);
    }), e._status === -1 && (e._status = 0, e._result = t);
  }
  if (e._status === 1)
    return e._result.default;
  throw e._result;
}
var xe = { current: null }, xo = { transition: null }, _m = { ReactCurrentDispatcher: xe, ReactCurrentBatchConfig: xo, ReactCurrentOwner: hs };
function pc() {
  throw Error("act(...) is not supported in production builds of React.");
}
z.Children = { map: Kr, forEach: function(e, t, n) {
  Kr(e, function() {
    t.apply(this, arguments);
  }, n);
}, count: function(e) {
  var t = 0;
  return Kr(e, function() {
    t++;
  }), t;
}, toArray: function(e) {
  return Kr(e, function(t) {
    return t;
  }) || [];
}, only: function(e) {
  if (!vs(e))
    throw Error("React.Children.only expected to receive a single React element child.");
  return e;
} };
z.Component = Un;
z.Fragment = mm;
z.Profiler = vm;
z.PureComponent = ps;
z.StrictMode = hm;
z.Suspense = Sm;
z.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = _m;
z.act = pc;
z.cloneElement = function(e, t, n) {
  if (e == null)
    throw Error("React.cloneElement(...): The argument must be a React element, but you passed " + e + ".");
  var r = sc({}, e.props), o = e.key, l = e.ref, i = e._owner;
  if (t != null) {
    if (t.ref !== void 0 && (l = t.ref, i = hs.current), t.key !== void 0 && (o = "" + t.key), e.type && e.type.defaultProps)
      var s = e.type.defaultProps;
    for (a in t)
      cc.call(t, a) && !dc.hasOwnProperty(a) && (r[a] = t[a] === void 0 && s !== void 0 ? s[a] : t[a]);
  }
  var a = arguments.length - 2;
  if (a === 1)
    r.children = n;
  else if (1 < a) {
    s = Array(a);
    for (var u = 0; u < a; u++)
      s[u] = arguments[u + 2];
    r.children = s;
  }
  return { $$typeof: Fr, type: e.type, key: o, ref: l, props: r, _owner: i };
};
z.createContext = function(e) {
  return e = { $$typeof: ym, _currentValue: e, _currentValue2: e, _threadCount: 0, Provider: null, Consumer: null, _defaultValue: null, _globalName: null }, e.Provider = { $$typeof: gm, _context: e }, e.Consumer = e;
};
z.createElement = fc;
z.createFactory = function(e) {
  var t = fc.bind(null, e);
  return t.type = e, t;
};
z.createRef = function() {
  return { current: null };
};
z.forwardRef = function(e) {
  return { $$typeof: wm, render: e };
};
z.isValidElement = vs;
z.lazy = function(e) {
  return { $$typeof: km, _payload: { _status: -1, _result: e }, _init: Nm };
};
z.memo = function(e, t) {
  return { $$typeof: xm, type: e, compare: t === void 0 ? null : t };
};
z.startTransition = function(e) {
  var t = xo.transition;
  xo.transition = {};
  try {
    e();
  } finally {
    xo.transition = t;
  }
};
z.unstable_act = pc;
z.useCallback = function(e, t) {
  return xe.current.useCallback(e, t);
};
z.useContext = function(e) {
  return xe.current.useContext(e);
};
z.useDebugValue = function() {
};
z.useDeferredValue = function(e) {
  return xe.current.useDeferredValue(e);
};
z.useEffect = function(e, t) {
  return xe.current.useEffect(e, t);
};
z.useId = function() {
  return xe.current.useId();
};
z.useImperativeHandle = function(e, t, n) {
  return xe.current.useImperativeHandle(e, t, n);
};
z.useInsertionEffect = function(e, t) {
  return xe.current.useInsertionEffect(e, t);
};
z.useLayoutEffect = function(e, t) {
  return xe.current.useLayoutEffect(e, t);
};
z.useMemo = function(e, t) {
  return xe.current.useMemo(e, t);
};
z.useReducer = function(e, t, n) {
  return xe.current.useReducer(e, t, n);
};
z.useRef = function(e) {
  return xe.current.useRef(e);
};
z.useState = function(e) {
  return xe.current.useState(e);
};
z.useSyncExternalStore = function(e, t, n) {
  return xe.current.useSyncExternalStore(e, t, n);
};
z.useTransition = function() {
  return xe.current.useTransition();
};
z.version = "18.3.1";
lc.exports = z;
var c = lc.exports;
const J = /* @__PURE__ */ rc(c), gs = /* @__PURE__ */ fm({
  __proto__: null,
  default: J
}, [c]);
/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Rm = c, Tm = Symbol.for("react.element"), Am = Symbol.for("react.fragment"), jm = Object.prototype.hasOwnProperty, Om = Rm.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner, bm = { key: !0, ref: !0, __self: !0, __source: !0 };
function mc(e, t, n) {
  var r, o = {}, l = null, i = null;
  n !== void 0 && (l = "" + n), t.key !== void 0 && (l = "" + t.key), t.ref !== void 0 && (i = t.ref);
  for (r in t)
    jm.call(t, r) && !bm.hasOwnProperty(r) && (o[r] = t[r]);
  if (e && e.defaultProps)
    for (r in t = e.defaultProps, t)
      o[r] === void 0 && (o[r] = t[r]);
  return { $$typeof: Tm, type: e, key: l, ref: i, props: o, _owner: Om.current };
}
cl.Fragment = Am;
cl.jsx = mc;
cl.jsxs = mc;
oc.exports = cl;
var g = oc.exports, vi = {}, hc = { exports: {} }, Ie = {}, vc = { exports: {} }, gc = {};
/**
 * @license React
 * scheduler.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
(function(e) {
  function t(C, I) {
    var L = C.length;
    C.push(I);
    e:
      for (; 0 < L; ) {
        var B = L - 1 >>> 1, X = C[B];
        if (0 < o(X, I))
          C[B] = I, C[L] = X, L = B;
        else
          break e;
      }
  }
  function n(C) {
    return C.length === 0 ? null : C[0];
  }
  function r(C) {
    if (C.length === 0)
      return null;
    var I = C[0], L = C.pop();
    if (L !== I) {
      C[0] = L;
      e:
        for (var B = 0, X = C.length, ne = X >>> 1; B < ne; ) {
          var q = 2 * (B + 1) - 1, kt = C[q], et = q + 1, Q = C[et];
          if (0 > o(kt, L))
            et < X && 0 > o(Q, kt) ? (C[B] = Q, C[et] = L, B = et) : (C[B] = kt, C[q] = L, B = q);
          else if (et < X && 0 > o(Q, L))
            C[B] = Q, C[et] = L, B = et;
          else
            break e;
        }
    }
    return I;
  }
  function o(C, I) {
    var L = C.sortIndex - I.sortIndex;
    return L !== 0 ? L : C.id - I.id;
  }
  if (typeof performance == "object" && typeof performance.now == "function") {
    var l = performance;
    e.unstable_now = function() {
      return l.now();
    };
  } else {
    var i = Date, s = i.now();
    e.unstable_now = function() {
      return i.now() - s;
    };
  }
  var a = [], u = [], f = 1, m = null, p = 3, w = !1, x = !1, y = !1, E = typeof setTimeout == "function" ? setTimeout : null, h = typeof clearTimeout == "function" ? clearTimeout : null, d = typeof setImmediate < "u" ? setImmediate : null;
  typeof navigator < "u" && navigator.scheduling !== void 0 && navigator.scheduling.isInputPending !== void 0 && navigator.scheduling.isInputPending.bind(navigator.scheduling);
  function v(C) {
    for (var I = n(u); I !== null; ) {
      if (I.callback === null)
        r(u);
      else if (I.startTime <= C)
        r(u), I.sortIndex = I.expirationTime, t(a, I);
      else
        break;
      I = n(u);
    }
  }
  function S(C) {
    if (y = !1, v(C), !x)
      if (n(a) !== null)
        x = !0, Te(P);
      else {
        var I = n(u);
        I !== null && Be(S, I.startTime - C);
      }
  }
  function P(C, I) {
    x = !1, y && (y = !1, h(k), k = -1), w = !0;
    var L = p;
    try {
      for (v(I), m = n(a); m !== null && (!(m.expirationTime > I) || C && !$()); ) {
        var B = m.callback;
        if (typeof B == "function") {
          m.callback = null, p = m.priorityLevel;
          var X = B(m.expirationTime <= I);
          I = e.unstable_now(), typeof X == "function" ? m.callback = X : m === n(a) && r(a), v(I);
        } else
          r(a);
        m = n(a);
      }
      if (m !== null)
        var ne = !0;
      else {
        var q = n(u);
        q !== null && Be(S, q.startTime - I), ne = !1;
      }
      return ne;
    } finally {
      m = null, p = L, w = !1;
    }
  }
  var R = !1, N = null, k = -1, O = 5, b = -1;
  function $() {
    return !(e.unstable_now() - b < O);
  }
  function Ce() {
    if (N !== null) {
      var C = e.unstable_now();
      b = C;
      var I = !0;
      try {
        I = N(!0, C);
      } finally {
        I ? St() : (R = !1, N = null);
      }
    } else
      R = !1;
  }
  var St;
  if (typeof d == "function")
    St = function() {
      d(Ce);
    };
  else if (typeof MessageChannel < "u") {
    var cn = new MessageChannel(), xt = cn.port2;
    cn.port1.onmessage = Ce, St = function() {
      xt.postMessage(null);
    };
  } else
    St = function() {
      E(Ce, 0);
    };
  function Te(C) {
    N = C, R || (R = !0, St());
  }
  function Be(C, I) {
    k = E(function() {
      C(e.unstable_now());
    }, I);
  }
  e.unstable_IdlePriority = 5, e.unstable_ImmediatePriority = 1, e.unstable_LowPriority = 4, e.unstable_NormalPriority = 3, e.unstable_Profiling = null, e.unstable_UserBlockingPriority = 2, e.unstable_cancelCallback = function(C) {
    C.callback = null;
  }, e.unstable_continueExecution = function() {
    x || w || (x = !0, Te(P));
  }, e.unstable_forceFrameRate = function(C) {
    0 > C || 125 < C ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported") : O = 0 < C ? Math.floor(1e3 / C) : 5;
  }, e.unstable_getCurrentPriorityLevel = function() {
    return p;
  }, e.unstable_getFirstCallbackNode = function() {
    return n(a);
  }, e.unstable_next = function(C) {
    switch (p) {
      case 1:
      case 2:
      case 3:
        var I = 3;
        break;
      default:
        I = p;
    }
    var L = p;
    p = I;
    try {
      return C();
    } finally {
      p = L;
    }
  }, e.unstable_pauseExecution = function() {
  }, e.unstable_requestPaint = function() {
  }, e.unstable_runWithPriority = function(C, I) {
    switch (C) {
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
        break;
      default:
        C = 3;
    }
    var L = p;
    p = C;
    try {
      return I();
    } finally {
      p = L;
    }
  }, e.unstable_scheduleCallback = function(C, I, L) {
    var B = e.unstable_now();
    switch (typeof L == "object" && L !== null ? (L = L.delay, L = typeof L == "number" && 0 < L ? B + L : B) : L = B, C) {
      case 1:
        var X = -1;
        break;
      case 2:
        X = 250;
        break;
      case 5:
        X = 1073741823;
        break;
      case 4:
        X = 1e4;
        break;
      default:
        X = 5e3;
    }
    return X = L + X, C = { id: f++, callback: I, priorityLevel: C, startTime: L, expirationTime: X, sortIndex: -1 }, L > B ? (C.sortIndex = L, t(u, C), n(a) === null && C === n(u) && (y ? (h(k), k = -1) : y = !0, Be(S, L - B))) : (C.sortIndex = X, t(a, C), x || w || (x = !0, Te(P))), C;
  }, e.unstable_shouldYield = $, e.unstable_wrapCallback = function(C) {
    var I = p;
    return function() {
      var L = p;
      p = I;
      try {
        return C.apply(this, arguments);
      } finally {
        p = L;
      }
    };
  };
})(gc);
vc.exports = gc;
var Im = vc.exports;
/**
 * @license React
 * react-dom.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Lm = c, be = Im;
function _(e) {
  for (var t = "https://reactjs.org/docs/error-decoder.html?invariant=" + e, n = 1; n < arguments.length; n++)
    t += "&args[]=" + encodeURIComponent(arguments[n]);
  return "Minified React error #" + e + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
}
var yc = /* @__PURE__ */ new Set(), kr = {};
function an(e, t) {
  Ln(e, t), Ln(e + "Capture", t);
}
function Ln(e, t) {
  for (kr[e] = t, e = 0; e < t.length; e++)
    yc.add(t[e]);
}
var mt = !(typeof window > "u" || typeof window.document > "u" || typeof window.document.createElement > "u"), gi = Object.prototype.hasOwnProperty, Dm = /^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/, _a = {}, Ra = {};
function zm(e) {
  return gi.call(Ra, e) ? !0 : gi.call(_a, e) ? !1 : Dm.test(e) ? Ra[e] = !0 : (_a[e] = !0, !1);
}
function Mm(e, t, n, r) {
  if (n !== null && n.type === 0)
    return !1;
  switch (typeof t) {
    case "function":
    case "symbol":
      return !0;
    case "boolean":
      return r ? !1 : n !== null ? !n.acceptsBooleans : (e = e.toLowerCase().slice(0, 5), e !== "data-" && e !== "aria-");
    default:
      return !1;
  }
}
function Fm(e, t, n, r) {
  if (t === null || typeof t > "u" || Mm(e, t, n, r))
    return !0;
  if (r)
    return !1;
  if (n !== null)
    switch (n.type) {
      case 3:
        return !t;
      case 4:
        return t === !1;
      case 5:
        return isNaN(t);
      case 6:
        return isNaN(t) || 1 > t;
    }
  return !1;
}
function ke(e, t, n, r, o, l, i) {
  this.acceptsBooleans = t === 2 || t === 3 || t === 4, this.attributeName = r, this.attributeNamespace = o, this.mustUseProperty = n, this.propertyName = e, this.type = t, this.sanitizeURL = l, this.removeEmptyString = i;
}
var me = {};
"children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(e) {
  me[e] = new ke(e, 0, !1, e, null, !1, !1);
});
[["acceptCharset", "accept-charset"], ["className", "class"], ["htmlFor", "for"], ["httpEquiv", "http-equiv"]].forEach(function(e) {
  var t = e[0];
  me[t] = new ke(t, 1, !1, e[1], null, !1, !1);
});
["contentEditable", "draggable", "spellCheck", "value"].forEach(function(e) {
  me[e] = new ke(e, 2, !1, e.toLowerCase(), null, !1, !1);
});
["autoReverse", "externalResourcesRequired", "focusable", "preserveAlpha"].forEach(function(e) {
  me[e] = new ke(e, 2, !1, e, null, !1, !1);
});
"allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(e) {
  me[e] = new ke(e, 3, !1, e.toLowerCase(), null, !1, !1);
});
["checked", "multiple", "muted", "selected"].forEach(function(e) {
  me[e] = new ke(e, 3, !0, e, null, !1, !1);
});
["capture", "download"].forEach(function(e) {
  me[e] = new ke(e, 4, !1, e, null, !1, !1);
});
["cols", "rows", "size", "span"].forEach(function(e) {
  me[e] = new ke(e, 6, !1, e, null, !1, !1);
});
["rowSpan", "start"].forEach(function(e) {
  me[e] = new ke(e, 5, !1, e.toLowerCase(), null, !1, !1);
});
var ys = /[\-:]([a-z])/g;
function ws(e) {
  return e[1].toUpperCase();
}
"accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(e) {
  var t = e.replace(
    ys,
    ws
  );
  me[t] = new ke(t, 1, !1, e, null, !1, !1);
});
"xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(e) {
  var t = e.replace(ys, ws);
  me[t] = new ke(t, 1, !1, e, "http://www.w3.org/1999/xlink", !1, !1);
});
["xml:base", "xml:lang", "xml:space"].forEach(function(e) {
  var t = e.replace(ys, ws);
  me[t] = new ke(t, 1, !1, e, "http://www.w3.org/XML/1998/namespace", !1, !1);
});
["tabIndex", "crossOrigin"].forEach(function(e) {
  me[e] = new ke(e, 1, !1, e.toLowerCase(), null, !1, !1);
});
me.xlinkHref = new ke("xlinkHref", 1, !1, "xlink:href", "http://www.w3.org/1999/xlink", !0, !1);
["src", "href", "action", "formAction"].forEach(function(e) {
  me[e] = new ke(e, 1, !1, e.toLowerCase(), null, !0, !0);
});
function Ss(e, t, n, r) {
  var o = me.hasOwnProperty(t) ? me[t] : null;
  (o !== null ? o.type !== 0 : r || !(2 < t.length) || t[0] !== "o" && t[0] !== "O" || t[1] !== "n" && t[1] !== "N") && (Fm(t, n, o, r) && (n = null), r || o === null ? zm(t) && (n === null ? e.removeAttribute(t) : e.setAttribute(t, "" + n)) : o.mustUseProperty ? e[o.propertyName] = n === null ? o.type === 3 ? !1 : "" : n : (t = o.attributeName, r = o.attributeNamespace, n === null ? e.removeAttribute(t) : (o = o.type, n = o === 3 || o === 4 && n === !0 ? "" : "" + n, r ? e.setAttributeNS(r, t, n) : e.setAttribute(t, n))));
}
var yt = Lm.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED, Xr = Symbol.for("react.element"), vn = Symbol.for("react.portal"), gn = Symbol.for("react.fragment"), xs = Symbol.for("react.strict_mode"), yi = Symbol.for("react.profiler"), wc = Symbol.for("react.provider"), Sc = Symbol.for("react.context"), ks = Symbol.for("react.forward_ref"), wi = Symbol.for("react.suspense"), Si = Symbol.for("react.suspense_list"), Cs = Symbol.for("react.memo"), Nt = Symbol.for("react.lazy"), xc = Symbol.for("react.offscreen"), Ta = Symbol.iterator;
function Kn(e) {
  return e === null || typeof e != "object" ? null : (e = Ta && e[Ta] || e["@@iterator"], typeof e == "function" ? e : null);
}
var K = Object.assign, Dl;
function or(e) {
  if (Dl === void 0)
    try {
      throw Error();
    } catch (n) {
      var t = n.stack.trim().match(/\n( *(at )?)/);
      Dl = t && t[1] || "";
    }
  return `
` + Dl + e;
}
var zl = !1;
function Ml(e, t) {
  if (!e || zl)
    return "";
  zl = !0;
  var n = Error.prepareStackTrace;
  Error.prepareStackTrace = void 0;
  try {
    if (t)
      if (t = function() {
        throw Error();
      }, Object.defineProperty(t.prototype, "props", { set: function() {
        throw Error();
      } }), typeof Reflect == "object" && Reflect.construct) {
        try {
          Reflect.construct(t, []);
        } catch (u) {
          var r = u;
        }
        Reflect.construct(e, [], t);
      } else {
        try {
          t.call();
        } catch (u) {
          r = u;
        }
        e.call(t.prototype);
      }
    else {
      try {
        throw Error();
      } catch (u) {
        r = u;
      }
      e();
    }
  } catch (u) {
    if (u && r && typeof u.stack == "string") {
      for (var o = u.stack.split(`
`), l = r.stack.split(`
`), i = o.length - 1, s = l.length - 1; 1 <= i && 0 <= s && o[i] !== l[s]; )
        s--;
      for (; 1 <= i && 0 <= s; i--, s--)
        if (o[i] !== l[s]) {
          if (i !== 1 || s !== 1)
            do
              if (i--, s--, 0 > s || o[i] !== l[s]) {
                var a = `
` + o[i].replace(" at new ", " at ");
                return e.displayName && a.includes("<anonymous>") && (a = a.replace("<anonymous>", e.displayName)), a;
              }
            while (1 <= i && 0 <= s);
          break;
        }
    }
  } finally {
    zl = !1, Error.prepareStackTrace = n;
  }
  return (e = e ? e.displayName || e.name : "") ? or(e) : "";
}
function $m(e) {
  switch (e.tag) {
    case 5:
      return or(e.type);
    case 16:
      return or("Lazy");
    case 13:
      return or("Suspense");
    case 19:
      return or("SuspenseList");
    case 0:
    case 2:
    case 15:
      return e = Ml(e.type, !1), e;
    case 11:
      return e = Ml(e.type.render, !1), e;
    case 1:
      return e = Ml(e.type, !0), e;
    default:
      return "";
  }
}
function xi(e) {
  if (e == null)
    return null;
  if (typeof e == "function")
    return e.displayName || e.name || null;
  if (typeof e == "string")
    return e;
  switch (e) {
    case gn:
      return "Fragment";
    case vn:
      return "Portal";
    case yi:
      return "Profiler";
    case xs:
      return "StrictMode";
    case wi:
      return "Suspense";
    case Si:
      return "SuspenseList";
  }
  if (typeof e == "object")
    switch (e.$$typeof) {
      case Sc:
        return (e.displayName || "Context") + ".Consumer";
      case wc:
        return (e._context.displayName || "Context") + ".Provider";
      case ks:
        var t = e.render;
        return e = e.displayName, e || (e = t.displayName || t.name || "", e = e !== "" ? "ForwardRef(" + e + ")" : "ForwardRef"), e;
      case Cs:
        return t = e.displayName || null, t !== null ? t : xi(e.type) || "Memo";
      case Nt:
        t = e._payload, e = e._init;
        try {
          return xi(e(t));
        } catch {
        }
    }
  return null;
}
function Wm(e) {
  var t = e.type;
  switch (e.tag) {
    case 24:
      return "Cache";
    case 9:
      return (t.displayName || "Context") + ".Consumer";
    case 10:
      return (t._context.displayName || "Context") + ".Provider";
    case 18:
      return "DehydratedFragment";
    case 11:
      return e = t.render, e = e.displayName || e.name || "", t.displayName || (e !== "" ? "ForwardRef(" + e + ")" : "ForwardRef");
    case 7:
      return "Fragment";
    case 5:
      return t;
    case 4:
      return "Portal";
    case 3:
      return "Root";
    case 6:
      return "Text";
    case 16:
      return xi(t);
    case 8:
      return t === xs ? "StrictMode" : "Mode";
    case 22:
      return "Offscreen";
    case 12:
      return "Profiler";
    case 21:
      return "Scope";
    case 13:
      return "Suspense";
    case 19:
      return "SuspenseList";
    case 25:
      return "TracingMarker";
    case 1:
    case 0:
    case 17:
    case 2:
    case 14:
    case 15:
      if (typeof t == "function")
        return t.displayName || t.name || null;
      if (typeof t == "string")
        return t;
  }
  return null;
}
function $t(e) {
  switch (typeof e) {
    case "boolean":
    case "number":
    case "string":
    case "undefined":
      return e;
    case "object":
      return e;
    default:
      return "";
  }
}
function kc(e) {
  var t = e.type;
  return (e = e.nodeName) && e.toLowerCase() === "input" && (t === "checkbox" || t === "radio");
}
function Vm(e) {
  var t = kc(e) ? "checked" : "value", n = Object.getOwnPropertyDescriptor(e.constructor.prototype, t), r = "" + e[t];
  if (!e.hasOwnProperty(t) && typeof n < "u" && typeof n.get == "function" && typeof n.set == "function") {
    var o = n.get, l = n.set;
    return Object.defineProperty(e, t, { configurable: !0, get: function() {
      return o.call(this);
    }, set: function(i) {
      r = "" + i, l.call(this, i);
    } }), Object.defineProperty(e, t, { enumerable: n.enumerable }), { getValue: function() {
      return r;
    }, setValue: function(i) {
      r = "" + i;
    }, stopTracking: function() {
      e._valueTracker = null, delete e[t];
    } };
  }
}
function Zr(e) {
  e._valueTracker || (e._valueTracker = Vm(e));
}
function Cc(e) {
  if (!e)
    return !1;
  var t = e._valueTracker;
  if (!t)
    return !0;
  var n = t.getValue(), r = "";
  return e && (r = kc(e) ? e.checked ? "true" : "false" : e.value), e = r, e !== n ? (t.setValue(e), !0) : !1;
}
function Io(e) {
  if (e = e || (typeof document < "u" ? document : void 0), typeof e > "u")
    return null;
  try {
    return e.activeElement || e.body;
  } catch {
    return e.body;
  }
}
function ki(e, t) {
  var n = t.checked;
  return K({}, t, { defaultChecked: void 0, defaultValue: void 0, value: void 0, checked: n ?? e._wrapperState.initialChecked });
}
function Aa(e, t) {
  var n = t.defaultValue == null ? "" : t.defaultValue, r = t.checked != null ? t.checked : t.defaultChecked;
  n = $t(t.value != null ? t.value : n), e._wrapperState = { initialChecked: r, initialValue: n, controlled: t.type === "checkbox" || t.type === "radio" ? t.checked != null : t.value != null };
}
function Ec(e, t) {
  t = t.checked, t != null && Ss(e, "checked", t, !1);
}
function Ci(e, t) {
  Ec(e, t);
  var n = $t(t.value), r = t.type;
  if (n != null)
    r === "number" ? (n === 0 && e.value === "" || e.value != n) && (e.value = "" + n) : e.value !== "" + n && (e.value = "" + n);
  else if (r === "submit" || r === "reset") {
    e.removeAttribute("value");
    return;
  }
  t.hasOwnProperty("value") ? Ei(e, t.type, n) : t.hasOwnProperty("defaultValue") && Ei(e, t.type, $t(t.defaultValue)), t.checked == null && t.defaultChecked != null && (e.defaultChecked = !!t.defaultChecked);
}
function ja(e, t, n) {
  if (t.hasOwnProperty("value") || t.hasOwnProperty("defaultValue")) {
    var r = t.type;
    if (!(r !== "submit" && r !== "reset" || t.value !== void 0 && t.value !== null))
      return;
    t = "" + e._wrapperState.initialValue, n || t === e.value || (e.value = t), e.defaultValue = t;
  }
  n = e.name, n !== "" && (e.name = ""), e.defaultChecked = !!e._wrapperState.initialChecked, n !== "" && (e.name = n);
}
function Ei(e, t, n) {
  (t !== "number" || Io(e.ownerDocument) !== e) && (n == null ? e.defaultValue = "" + e._wrapperState.initialValue : e.defaultValue !== "" + n && (e.defaultValue = "" + n));
}
var lr = Array.isArray;
function Rn(e, t, n, r) {
  if (e = e.options, t) {
    t = {};
    for (var o = 0; o < n.length; o++)
      t["$" + n[o]] = !0;
    for (n = 0; n < e.length; n++)
      o = t.hasOwnProperty("$" + e[n].value), e[n].selected !== o && (e[n].selected = o), o && r && (e[n].defaultSelected = !0);
  } else {
    for (n = "" + $t(n), t = null, o = 0; o < e.length; o++) {
      if (e[o].value === n) {
        e[o].selected = !0, r && (e[o].defaultSelected = !0);
        return;
      }
      t !== null || e[o].disabled || (t = e[o]);
    }
    t !== null && (t.selected = !0);
  }
}
function Pi(e, t) {
  if (t.dangerouslySetInnerHTML != null)
    throw Error(_(91));
  return K({}, t, { value: void 0, defaultValue: void 0, children: "" + e._wrapperState.initialValue });
}
function Oa(e, t) {
  var n = t.value;
  if (n == null) {
    if (n = t.children, t = t.defaultValue, n != null) {
      if (t != null)
        throw Error(_(92));
      if (lr(n)) {
        if (1 < n.length)
          throw Error(_(93));
        n = n[0];
      }
      t = n;
    }
    t == null && (t = ""), n = t;
  }
  e._wrapperState = { initialValue: $t(n) };
}
function Pc(e, t) {
  var n = $t(t.value), r = $t(t.defaultValue);
  n != null && (n = "" + n, n !== e.value && (e.value = n), t.defaultValue == null && e.defaultValue !== n && (e.defaultValue = n)), r != null && (e.defaultValue = "" + r);
}
function ba(e) {
  var t = e.textContent;
  t === e._wrapperState.initialValue && t !== "" && t !== null && (e.value = t);
}
function Nc(e) {
  switch (e) {
    case "svg":
      return "http://www.w3.org/2000/svg";
    case "math":
      return "http://www.w3.org/1998/Math/MathML";
    default:
      return "http://www.w3.org/1999/xhtml";
  }
}
function Ni(e, t) {
  return e == null || e === "http://www.w3.org/1999/xhtml" ? Nc(t) : e === "http://www.w3.org/2000/svg" && t === "foreignObject" ? "http://www.w3.org/1999/xhtml" : e;
}
var Jr, _c = function(e) {
  return typeof MSApp < "u" && MSApp.execUnsafeLocalFunction ? function(t, n, r, o) {
    MSApp.execUnsafeLocalFunction(function() {
      return e(t, n, r, o);
    });
  } : e;
}(function(e, t) {
  if (e.namespaceURI !== "http://www.w3.org/2000/svg" || "innerHTML" in e)
    e.innerHTML = t;
  else {
    for (Jr = Jr || document.createElement("div"), Jr.innerHTML = "<svg>" + t.valueOf().toString() + "</svg>", t = Jr.firstChild; e.firstChild; )
      e.removeChild(e.firstChild);
    for (; t.firstChild; )
      e.appendChild(t.firstChild);
  }
});
function Cr(e, t) {
  if (t) {
    var n = e.firstChild;
    if (n && n === e.lastChild && n.nodeType === 3) {
      n.nodeValue = t;
      return;
    }
  }
  e.textContent = t;
}
var fr = {
  animationIterationCount: !0,
  aspectRatio: !0,
  borderImageOutset: !0,
  borderImageSlice: !0,
  borderImageWidth: !0,
  boxFlex: !0,
  boxFlexGroup: !0,
  boxOrdinalGroup: !0,
  columnCount: !0,
  columns: !0,
  flex: !0,
  flexGrow: !0,
  flexPositive: !0,
  flexShrink: !0,
  flexNegative: !0,
  flexOrder: !0,
  gridArea: !0,
  gridRow: !0,
  gridRowEnd: !0,
  gridRowSpan: !0,
  gridRowStart: !0,
  gridColumn: !0,
  gridColumnEnd: !0,
  gridColumnSpan: !0,
  gridColumnStart: !0,
  fontWeight: !0,
  lineClamp: !0,
  lineHeight: !0,
  opacity: !0,
  order: !0,
  orphans: !0,
  tabSize: !0,
  widows: !0,
  zIndex: !0,
  zoom: !0,
  fillOpacity: !0,
  floodOpacity: !0,
  stopOpacity: !0,
  strokeDasharray: !0,
  strokeDashoffset: !0,
  strokeMiterlimit: !0,
  strokeOpacity: !0,
  strokeWidth: !0
}, Um = ["Webkit", "ms", "Moz", "O"];
Object.keys(fr).forEach(function(e) {
  Um.forEach(function(t) {
    t = t + e.charAt(0).toUpperCase() + e.substring(1), fr[t] = fr[e];
  });
});
function Rc(e, t, n) {
  return t == null || typeof t == "boolean" || t === "" ? "" : n || typeof t != "number" || t === 0 || fr.hasOwnProperty(e) && fr[e] ? ("" + t).trim() : t + "px";
}
function Tc(e, t) {
  e = e.style;
  for (var n in t)
    if (t.hasOwnProperty(n)) {
      var r = n.indexOf("--") === 0, o = Rc(n, t[n], r);
      n === "float" && (n = "cssFloat"), r ? e.setProperty(n, o) : e[n] = o;
    }
}
var Bm = K({ menuitem: !0 }, { area: !0, base: !0, br: !0, col: !0, embed: !0, hr: !0, img: !0, input: !0, keygen: !0, link: !0, meta: !0, param: !0, source: !0, track: !0, wbr: !0 });
function _i(e, t) {
  if (t) {
    if (Bm[e] && (t.children != null || t.dangerouslySetInnerHTML != null))
      throw Error(_(137, e));
    if (t.dangerouslySetInnerHTML != null) {
      if (t.children != null)
        throw Error(_(60));
      if (typeof t.dangerouslySetInnerHTML != "object" || !("__html" in t.dangerouslySetInnerHTML))
        throw Error(_(61));
    }
    if (t.style != null && typeof t.style != "object")
      throw Error(_(62));
  }
}
function Ri(e, t) {
  if (e.indexOf("-") === -1)
    return typeof t.is == "string";
  switch (e) {
    case "annotation-xml":
    case "color-profile":
    case "font-face":
    case "font-face-src":
    case "font-face-uri":
    case "font-face-format":
    case "font-face-name":
    case "missing-glyph":
      return !1;
    default:
      return !0;
  }
}
var Ti = null;
function Es(e) {
  return e = e.target || e.srcElement || window, e.correspondingUseElement && (e = e.correspondingUseElement), e.nodeType === 3 ? e.parentNode : e;
}
var Ai = null, Tn = null, An = null;
function Ia(e) {
  if (e = Vr(e)) {
    if (typeof Ai != "function")
      throw Error(_(280));
    var t = e.stateNode;
    t && (t = hl(t), Ai(e.stateNode, e.type, t));
  }
}
function Ac(e) {
  Tn ? An ? An.push(e) : An = [e] : Tn = e;
}
function jc() {
  if (Tn) {
    var e = Tn, t = An;
    if (An = Tn = null, Ia(e), t)
      for (e = 0; e < t.length; e++)
        Ia(t[e]);
  }
}
function Oc(e, t) {
  return e(t);
}
function bc() {
}
var Fl = !1;
function Ic(e, t, n) {
  if (Fl)
    return e(t, n);
  Fl = !0;
  try {
    return Oc(e, t, n);
  } finally {
    Fl = !1, (Tn !== null || An !== null) && (bc(), jc());
  }
}
function Er(e, t) {
  var n = e.stateNode;
  if (n === null)
    return null;
  var r = hl(n);
  if (r === null)
    return null;
  n = r[t];
  e:
    switch (t) {
      case "onClick":
      case "onClickCapture":
      case "onDoubleClick":
      case "onDoubleClickCapture":
      case "onMouseDown":
      case "onMouseDownCapture":
      case "onMouseMove":
      case "onMouseMoveCapture":
      case "onMouseUp":
      case "onMouseUpCapture":
      case "onMouseEnter":
        (r = !r.disabled) || (e = e.type, r = !(e === "button" || e === "input" || e === "select" || e === "textarea")), e = !r;
        break e;
      default:
        e = !1;
    }
  if (e)
    return null;
  if (n && typeof n != "function")
    throw Error(_(231, t, typeof n));
  return n;
}
var ji = !1;
if (mt)
  try {
    var Xn = {};
    Object.defineProperty(Xn, "passive", { get: function() {
      ji = !0;
    } }), window.addEventListener("test", Xn, Xn), window.removeEventListener("test", Xn, Xn);
  } catch {
    ji = !1;
  }
function Hm(e, t, n, r, o, l, i, s, a) {
  var u = Array.prototype.slice.call(arguments, 3);
  try {
    t.apply(n, u);
  } catch (f) {
    this.onError(f);
  }
}
var pr = !1, Lo = null, Do = !1, Oi = null, Qm = { onError: function(e) {
  pr = !0, Lo = e;
} };
function Ym(e, t, n, r, o, l, i, s, a) {
  pr = !1, Lo = null, Hm.apply(Qm, arguments);
}
function Gm(e, t, n, r, o, l, i, s, a) {
  if (Ym.apply(this, arguments), pr) {
    if (pr) {
      var u = Lo;
      pr = !1, Lo = null;
    } else
      throw Error(_(198));
    Do || (Do = !0, Oi = u);
  }
}
function un(e) {
  var t = e, n = e;
  if (e.alternate)
    for (; t.return; )
      t = t.return;
  else {
    e = t;
    do
      t = e, t.flags & 4098 && (n = t.return), e = t.return;
    while (e);
  }
  return t.tag === 3 ? n : null;
}
function Lc(e) {
  if (e.tag === 13) {
    var t = e.memoizedState;
    if (t === null && (e = e.alternate, e !== null && (t = e.memoizedState)), t !== null)
      return t.dehydrated;
  }
  return null;
}
function La(e) {
  if (un(e) !== e)
    throw Error(_(188));
}
function Km(e) {
  var t = e.alternate;
  if (!t) {
    if (t = un(e), t === null)
      throw Error(_(188));
    return t !== e ? null : e;
  }
  for (var n = e, r = t; ; ) {
    var o = n.return;
    if (o === null)
      break;
    var l = o.alternate;
    if (l === null) {
      if (r = o.return, r !== null) {
        n = r;
        continue;
      }
      break;
    }
    if (o.child === l.child) {
      for (l = o.child; l; ) {
        if (l === n)
          return La(o), e;
        if (l === r)
          return La(o), t;
        l = l.sibling;
      }
      throw Error(_(188));
    }
    if (n.return !== r.return)
      n = o, r = l;
    else {
      for (var i = !1, s = o.child; s; ) {
        if (s === n) {
          i = !0, n = o, r = l;
          break;
        }
        if (s === r) {
          i = !0, r = o, n = l;
          break;
        }
        s = s.sibling;
      }
      if (!i) {
        for (s = l.child; s; ) {
          if (s === n) {
            i = !0, n = l, r = o;
            break;
          }
          if (s === r) {
            i = !0, r = l, n = o;
            break;
          }
          s = s.sibling;
        }
        if (!i)
          throw Error(_(189));
      }
    }
    if (n.alternate !== r)
      throw Error(_(190));
  }
  if (n.tag !== 3)
    throw Error(_(188));
  return n.stateNode.current === n ? e : t;
}
function Dc(e) {
  return e = Km(e), e !== null ? zc(e) : null;
}
function zc(e) {
  if (e.tag === 5 || e.tag === 6)
    return e;
  for (e = e.child; e !== null; ) {
    var t = zc(e);
    if (t !== null)
      return t;
    e = e.sibling;
  }
  return null;
}
var Mc = be.unstable_scheduleCallback, Da = be.unstable_cancelCallback, Xm = be.unstable_shouldYield, Zm = be.unstable_requestPaint, ee = be.unstable_now, Jm = be.unstable_getCurrentPriorityLevel, Ps = be.unstable_ImmediatePriority, Fc = be.unstable_UserBlockingPriority, zo = be.unstable_NormalPriority, qm = be.unstable_LowPriority, $c = be.unstable_IdlePriority, dl = null, lt = null;
function eh(e) {
  if (lt && typeof lt.onCommitFiberRoot == "function")
    try {
      lt.onCommitFiberRoot(dl, e, void 0, (e.current.flags & 128) === 128);
    } catch {
    }
}
var Ke = Math.clz32 ? Math.clz32 : rh, th = Math.log, nh = Math.LN2;
function rh(e) {
  return e >>>= 0, e === 0 ? 32 : 31 - (th(e) / nh | 0) | 0;
}
var qr = 64, eo = 4194304;
function ir(e) {
  switch (e & -e) {
    case 1:
      return 1;
    case 2:
      return 2;
    case 4:
      return 4;
    case 8:
      return 8;
    case 16:
      return 16;
    case 32:
      return 32;
    case 64:
    case 128:
    case 256:
    case 512:
    case 1024:
    case 2048:
    case 4096:
    case 8192:
    case 16384:
    case 32768:
    case 65536:
    case 131072:
    case 262144:
    case 524288:
    case 1048576:
    case 2097152:
      return e & 4194240;
    case 4194304:
    case 8388608:
    case 16777216:
    case 33554432:
    case 67108864:
      return e & 130023424;
    case 134217728:
      return 134217728;
    case 268435456:
      return 268435456;
    case 536870912:
      return 536870912;
    case 1073741824:
      return 1073741824;
    default:
      return e;
  }
}
function Mo(e, t) {
  var n = e.pendingLanes;
  if (n === 0)
    return 0;
  var r = 0, o = e.suspendedLanes, l = e.pingedLanes, i = n & 268435455;
  if (i !== 0) {
    var s = i & ~o;
    s !== 0 ? r = ir(s) : (l &= i, l !== 0 && (r = ir(l)));
  } else
    i = n & ~o, i !== 0 ? r = ir(i) : l !== 0 && (r = ir(l));
  if (r === 0)
    return 0;
  if (t !== 0 && t !== r && !(t & o) && (o = r & -r, l = t & -t, o >= l || o === 16 && (l & 4194240) !== 0))
    return t;
  if (r & 4 && (r |= n & 16), t = e.entangledLanes, t !== 0)
    for (e = e.entanglements, t &= r; 0 < t; )
      n = 31 - Ke(t), o = 1 << n, r |= e[n], t &= ~o;
  return r;
}
function oh(e, t) {
  switch (e) {
    case 1:
    case 2:
    case 4:
      return t + 250;
    case 8:
    case 16:
    case 32:
    case 64:
    case 128:
    case 256:
    case 512:
    case 1024:
    case 2048:
    case 4096:
    case 8192:
    case 16384:
    case 32768:
    case 65536:
    case 131072:
    case 262144:
    case 524288:
    case 1048576:
    case 2097152:
      return t + 5e3;
    case 4194304:
    case 8388608:
    case 16777216:
    case 33554432:
    case 67108864:
      return -1;
    case 134217728:
    case 268435456:
    case 536870912:
    case 1073741824:
      return -1;
    default:
      return -1;
  }
}
function lh(e, t) {
  for (var n = e.suspendedLanes, r = e.pingedLanes, o = e.expirationTimes, l = e.pendingLanes; 0 < l; ) {
    var i = 31 - Ke(l), s = 1 << i, a = o[i];
    a === -1 ? (!(s & n) || s & r) && (o[i] = oh(s, t)) : a <= t && (e.expiredLanes |= s), l &= ~s;
  }
}
function bi(e) {
  return e = e.pendingLanes & -1073741825, e !== 0 ? e : e & 1073741824 ? 1073741824 : 0;
}
function Wc() {
  var e = qr;
  return qr <<= 1, !(qr & 4194240) && (qr = 64), e;
}
function $l(e) {
  for (var t = [], n = 0; 31 > n; n++)
    t.push(e);
  return t;
}
function $r(e, t, n) {
  e.pendingLanes |= t, t !== 536870912 && (e.suspendedLanes = 0, e.pingedLanes = 0), e = e.eventTimes, t = 31 - Ke(t), e[t] = n;
}
function ih(e, t) {
  var n = e.pendingLanes & ~t;
  e.pendingLanes = t, e.suspendedLanes = 0, e.pingedLanes = 0, e.expiredLanes &= t, e.mutableReadLanes &= t, e.entangledLanes &= t, t = e.entanglements;
  var r = e.eventTimes;
  for (e = e.expirationTimes; 0 < n; ) {
    var o = 31 - Ke(n), l = 1 << o;
    t[o] = 0, r[o] = -1, e[o] = -1, n &= ~l;
  }
}
function Ns(e, t) {
  var n = e.entangledLanes |= t;
  for (e = e.entanglements; n; ) {
    var r = 31 - Ke(n), o = 1 << r;
    o & t | e[r] & t && (e[r] |= t), n &= ~o;
  }
}
var F = 0;
function Vc(e) {
  return e &= -e, 1 < e ? 4 < e ? e & 268435455 ? 16 : 536870912 : 4 : 1;
}
var Uc, _s, Bc, Hc, Qc, Ii = !1, to = [], Ot = null, bt = null, It = null, Pr = /* @__PURE__ */ new Map(), Nr = /* @__PURE__ */ new Map(), Rt = [], sh = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit".split(" ");
function za(e, t) {
  switch (e) {
    case "focusin":
    case "focusout":
      Ot = null;
      break;
    case "dragenter":
    case "dragleave":
      bt = null;
      break;
    case "mouseover":
    case "mouseout":
      It = null;
      break;
    case "pointerover":
    case "pointerout":
      Pr.delete(t.pointerId);
      break;
    case "gotpointercapture":
    case "lostpointercapture":
      Nr.delete(t.pointerId);
  }
}
function Zn(e, t, n, r, o, l) {
  return e === null || e.nativeEvent !== l ? (e = { blockedOn: t, domEventName: n, eventSystemFlags: r, nativeEvent: l, targetContainers: [o] }, t !== null && (t = Vr(t), t !== null && _s(t)), e) : (e.eventSystemFlags |= r, t = e.targetContainers, o !== null && t.indexOf(o) === -1 && t.push(o), e);
}
function ah(e, t, n, r, o) {
  switch (t) {
    case "focusin":
      return Ot = Zn(Ot, e, t, n, r, o), !0;
    case "dragenter":
      return bt = Zn(bt, e, t, n, r, o), !0;
    case "mouseover":
      return It = Zn(It, e, t, n, r, o), !0;
    case "pointerover":
      var l = o.pointerId;
      return Pr.set(l, Zn(Pr.get(l) || null, e, t, n, r, o)), !0;
    case "gotpointercapture":
      return l = o.pointerId, Nr.set(l, Zn(Nr.get(l) || null, e, t, n, r, o)), !0;
  }
  return !1;
}
function Yc(e) {
  var t = Kt(e.target);
  if (t !== null) {
    var n = un(t);
    if (n !== null) {
      if (t = n.tag, t === 13) {
        if (t = Lc(n), t !== null) {
          e.blockedOn = t, Qc(e.priority, function() {
            Bc(n);
          });
          return;
        }
      } else if (t === 3 && n.stateNode.current.memoizedState.isDehydrated) {
        e.blockedOn = n.tag === 3 ? n.stateNode.containerInfo : null;
        return;
      }
    }
  }
  e.blockedOn = null;
}
function ko(e) {
  if (e.blockedOn !== null)
    return !1;
  for (var t = e.targetContainers; 0 < t.length; ) {
    var n = Li(e.domEventName, e.eventSystemFlags, t[0], e.nativeEvent);
    if (n === null) {
      n = e.nativeEvent;
      var r = new n.constructor(n.type, n);
      Ti = r, n.target.dispatchEvent(r), Ti = null;
    } else
      return t = Vr(n), t !== null && _s(t), e.blockedOn = n, !1;
    t.shift();
  }
  return !0;
}
function Ma(e, t, n) {
  ko(e) && n.delete(t);
}
function uh() {
  Ii = !1, Ot !== null && ko(Ot) && (Ot = null), bt !== null && ko(bt) && (bt = null), It !== null && ko(It) && (It = null), Pr.forEach(Ma), Nr.forEach(Ma);
}
function Jn(e, t) {
  e.blockedOn === t && (e.blockedOn = null, Ii || (Ii = !0, be.unstable_scheduleCallback(be.unstable_NormalPriority, uh)));
}
function _r(e) {
  function t(o) {
    return Jn(o, e);
  }
  if (0 < to.length) {
    Jn(to[0], e);
    for (var n = 1; n < to.length; n++) {
      var r = to[n];
      r.blockedOn === e && (r.blockedOn = null);
    }
  }
  for (Ot !== null && Jn(Ot, e), bt !== null && Jn(bt, e), It !== null && Jn(It, e), Pr.forEach(t), Nr.forEach(t), n = 0; n < Rt.length; n++)
    r = Rt[n], r.blockedOn === e && (r.blockedOn = null);
  for (; 0 < Rt.length && (n = Rt[0], n.blockedOn === null); )
    Yc(n), n.blockedOn === null && Rt.shift();
}
var jn = yt.ReactCurrentBatchConfig, Fo = !0;
function ch(e, t, n, r) {
  var o = F, l = jn.transition;
  jn.transition = null;
  try {
    F = 1, Rs(e, t, n, r);
  } finally {
    F = o, jn.transition = l;
  }
}
function dh(e, t, n, r) {
  var o = F, l = jn.transition;
  jn.transition = null;
  try {
    F = 4, Rs(e, t, n, r);
  } finally {
    F = o, jn.transition = l;
  }
}
function Rs(e, t, n, r) {
  if (Fo) {
    var o = Li(e, t, n, r);
    if (o === null)
      Xl(e, t, r, $o, n), za(e, r);
    else if (ah(o, e, t, n, r))
      r.stopPropagation();
    else if (za(e, r), t & 4 && -1 < sh.indexOf(e)) {
      for (; o !== null; ) {
        var l = Vr(o);
        if (l !== null && Uc(l), l = Li(e, t, n, r), l === null && Xl(e, t, r, $o, n), l === o)
          break;
        o = l;
      }
      o !== null && r.stopPropagation();
    } else
      Xl(e, t, r, null, n);
  }
}
var $o = null;
function Li(e, t, n, r) {
  if ($o = null, e = Es(r), e = Kt(e), e !== null)
    if (t = un(e), t === null)
      e = null;
    else if (n = t.tag, n === 13) {
      if (e = Lc(t), e !== null)
        return e;
      e = null;
    } else if (n === 3) {
      if (t.stateNode.current.memoizedState.isDehydrated)
        return t.tag === 3 ? t.stateNode.containerInfo : null;
      e = null;
    } else
      t !== e && (e = null);
  return $o = e, null;
}
function Gc(e) {
  switch (e) {
    case "cancel":
    case "click":
    case "close":
    case "contextmenu":
    case "copy":
    case "cut":
    case "auxclick":
    case "dblclick":
    case "dragend":
    case "dragstart":
    case "drop":
    case "focusin":
    case "focusout":
    case "input":
    case "invalid":
    case "keydown":
    case "keypress":
    case "keyup":
    case "mousedown":
    case "mouseup":
    case "paste":
    case "pause":
    case "play":
    case "pointercancel":
    case "pointerdown":
    case "pointerup":
    case "ratechange":
    case "reset":
    case "resize":
    case "seeked":
    case "submit":
    case "touchcancel":
    case "touchend":
    case "touchstart":
    case "volumechange":
    case "change":
    case "selectionchange":
    case "textInput":
    case "compositionstart":
    case "compositionend":
    case "compositionupdate":
    case "beforeblur":
    case "afterblur":
    case "beforeinput":
    case "blur":
    case "fullscreenchange":
    case "focus":
    case "hashchange":
    case "popstate":
    case "select":
    case "selectstart":
      return 1;
    case "drag":
    case "dragenter":
    case "dragexit":
    case "dragleave":
    case "dragover":
    case "mousemove":
    case "mouseout":
    case "mouseover":
    case "pointermove":
    case "pointerout":
    case "pointerover":
    case "scroll":
    case "toggle":
    case "touchmove":
    case "wheel":
    case "mouseenter":
    case "mouseleave":
    case "pointerenter":
    case "pointerleave":
      return 4;
    case "message":
      switch (Jm()) {
        case Ps:
          return 1;
        case Fc:
          return 4;
        case zo:
        case qm:
          return 16;
        case $c:
          return 536870912;
        default:
          return 16;
      }
    default:
      return 16;
  }
}
var At = null, Ts = null, Co = null;
function Kc() {
  if (Co)
    return Co;
  var e, t = Ts, n = t.length, r, o = "value" in At ? At.value : At.textContent, l = o.length;
  for (e = 0; e < n && t[e] === o[e]; e++)
    ;
  var i = n - e;
  for (r = 1; r <= i && t[n - r] === o[l - r]; r++)
    ;
  return Co = o.slice(e, 1 < r ? 1 - r : void 0);
}
function Eo(e) {
  var t = e.keyCode;
  return "charCode" in e ? (e = e.charCode, e === 0 && t === 13 && (e = 13)) : e = t, e === 10 && (e = 13), 32 <= e || e === 13 ? e : 0;
}
function no() {
  return !0;
}
function Fa() {
  return !1;
}
function Le(e) {
  function t(n, r, o, l, i) {
    this._reactName = n, this._targetInst = o, this.type = r, this.nativeEvent = l, this.target = i, this.currentTarget = null;
    for (var s in e)
      e.hasOwnProperty(s) && (n = e[s], this[s] = n ? n(l) : l[s]);
    return this.isDefaultPrevented = (l.defaultPrevented != null ? l.defaultPrevented : l.returnValue === !1) ? no : Fa, this.isPropagationStopped = Fa, this;
  }
  return K(t.prototype, { preventDefault: function() {
    this.defaultPrevented = !0;
    var n = this.nativeEvent;
    n && (n.preventDefault ? n.preventDefault() : typeof n.returnValue != "unknown" && (n.returnValue = !1), this.isDefaultPrevented = no);
  }, stopPropagation: function() {
    var n = this.nativeEvent;
    n && (n.stopPropagation ? n.stopPropagation() : typeof n.cancelBubble != "unknown" && (n.cancelBubble = !0), this.isPropagationStopped = no);
  }, persist: function() {
  }, isPersistent: no }), t;
}
var Bn = { eventPhase: 0, bubbles: 0, cancelable: 0, timeStamp: function(e) {
  return e.timeStamp || Date.now();
}, defaultPrevented: 0, isTrusted: 0 }, As = Le(Bn), Wr = K({}, Bn, { view: 0, detail: 0 }), fh = Le(Wr), Wl, Vl, qn, fl = K({}, Wr, { screenX: 0, screenY: 0, clientX: 0, clientY: 0, pageX: 0, pageY: 0, ctrlKey: 0, shiftKey: 0, altKey: 0, metaKey: 0, getModifierState: js, button: 0, buttons: 0, relatedTarget: function(e) {
  return e.relatedTarget === void 0 ? e.fromElement === e.srcElement ? e.toElement : e.fromElement : e.relatedTarget;
}, movementX: function(e) {
  return "movementX" in e ? e.movementX : (e !== qn && (qn && e.type === "mousemove" ? (Wl = e.screenX - qn.screenX, Vl = e.screenY - qn.screenY) : Vl = Wl = 0, qn = e), Wl);
}, movementY: function(e) {
  return "movementY" in e ? e.movementY : Vl;
} }), $a = Le(fl), ph = K({}, fl, { dataTransfer: 0 }), mh = Le(ph), hh = K({}, Wr, { relatedTarget: 0 }), Ul = Le(hh), vh = K({}, Bn, { animationName: 0, elapsedTime: 0, pseudoElement: 0 }), gh = Le(vh), yh = K({}, Bn, { clipboardData: function(e) {
  return "clipboardData" in e ? e.clipboardData : window.clipboardData;
} }), wh = Le(yh), Sh = K({}, Bn, { data: 0 }), Wa = Le(Sh), xh = {
  Esc: "Escape",
  Spacebar: " ",
  Left: "ArrowLeft",
  Up: "ArrowUp",
  Right: "ArrowRight",
  Down: "ArrowDown",
  Del: "Delete",
  Win: "OS",
  Menu: "ContextMenu",
  Apps: "ContextMenu",
  Scroll: "ScrollLock",
  MozPrintableKey: "Unidentified"
}, kh = {
  8: "Backspace",
  9: "Tab",
  12: "Clear",
  13: "Enter",
  16: "Shift",
  17: "Control",
  18: "Alt",
  19: "Pause",
  20: "CapsLock",
  27: "Escape",
  32: " ",
  33: "PageUp",
  34: "PageDown",
  35: "End",
  36: "Home",
  37: "ArrowLeft",
  38: "ArrowUp",
  39: "ArrowRight",
  40: "ArrowDown",
  45: "Insert",
  46: "Delete",
  112: "F1",
  113: "F2",
  114: "F3",
  115: "F4",
  116: "F5",
  117: "F6",
  118: "F7",
  119: "F8",
  120: "F9",
  121: "F10",
  122: "F11",
  123: "F12",
  144: "NumLock",
  145: "ScrollLock",
  224: "Meta"
}, Ch = { Alt: "altKey", Control: "ctrlKey", Meta: "metaKey", Shift: "shiftKey" };
function Eh(e) {
  var t = this.nativeEvent;
  return t.getModifierState ? t.getModifierState(e) : (e = Ch[e]) ? !!t[e] : !1;
}
function js() {
  return Eh;
}
var Ph = K({}, Wr, { key: function(e) {
  if (e.key) {
    var t = xh[e.key] || e.key;
    if (t !== "Unidentified")
      return t;
  }
  return e.type === "keypress" ? (e = Eo(e), e === 13 ? "Enter" : String.fromCharCode(e)) : e.type === "keydown" || e.type === "keyup" ? kh[e.keyCode] || "Unidentified" : "";
}, code: 0, location: 0, ctrlKey: 0, shiftKey: 0, altKey: 0, metaKey: 0, repeat: 0, locale: 0, getModifierState: js, charCode: function(e) {
  return e.type === "keypress" ? Eo(e) : 0;
}, keyCode: function(e) {
  return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
}, which: function(e) {
  return e.type === "keypress" ? Eo(e) : e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
} }), Nh = Le(Ph), _h = K({}, fl, { pointerId: 0, width: 0, height: 0, pressure: 0, tangentialPressure: 0, tiltX: 0, tiltY: 0, twist: 0, pointerType: 0, isPrimary: 0 }), Va = Le(_h), Rh = K({}, Wr, { touches: 0, targetTouches: 0, changedTouches: 0, altKey: 0, metaKey: 0, ctrlKey: 0, shiftKey: 0, getModifierState: js }), Th = Le(Rh), Ah = K({}, Bn, { propertyName: 0, elapsedTime: 0, pseudoElement: 0 }), jh = Le(Ah), Oh = K({}, fl, {
  deltaX: function(e) {
    return "deltaX" in e ? e.deltaX : "wheelDeltaX" in e ? -e.wheelDeltaX : 0;
  },
  deltaY: function(e) {
    return "deltaY" in e ? e.deltaY : "wheelDeltaY" in e ? -e.wheelDeltaY : "wheelDelta" in e ? -e.wheelDelta : 0;
  },
  deltaZ: 0,
  deltaMode: 0
}), bh = Le(Oh), Ih = [9, 13, 27, 32], Os = mt && "CompositionEvent" in window, mr = null;
mt && "documentMode" in document && (mr = document.documentMode);
var Lh = mt && "TextEvent" in window && !mr, Xc = mt && (!Os || mr && 8 < mr && 11 >= mr), Ua = String.fromCharCode(32), Ba = !1;
function Zc(e, t) {
  switch (e) {
    case "keyup":
      return Ih.indexOf(t.keyCode) !== -1;
    case "keydown":
      return t.keyCode !== 229;
    case "keypress":
    case "mousedown":
    case "focusout":
      return !0;
    default:
      return !1;
  }
}
function Jc(e) {
  return e = e.detail, typeof e == "object" && "data" in e ? e.data : null;
}
var yn = !1;
function Dh(e, t) {
  switch (e) {
    case "compositionend":
      return Jc(t);
    case "keypress":
      return t.which !== 32 ? null : (Ba = !0, Ua);
    case "textInput":
      return e = t.data, e === Ua && Ba ? null : e;
    default:
      return null;
  }
}
function zh(e, t) {
  if (yn)
    return e === "compositionend" || !Os && Zc(e, t) ? (e = Kc(), Co = Ts = At = null, yn = !1, e) : null;
  switch (e) {
    case "paste":
      return null;
    case "keypress":
      if (!(t.ctrlKey || t.altKey || t.metaKey) || t.ctrlKey && t.altKey) {
        if (t.char && 1 < t.char.length)
          return t.char;
        if (t.which)
          return String.fromCharCode(t.which);
      }
      return null;
    case "compositionend":
      return Xc && t.locale !== "ko" ? null : t.data;
    default:
      return null;
  }
}
var Mh = { color: !0, date: !0, datetime: !0, "datetime-local": !0, email: !0, month: !0, number: !0, password: !0, range: !0, search: !0, tel: !0, text: !0, time: !0, url: !0, week: !0 };
function Ha(e) {
  var t = e && e.nodeName && e.nodeName.toLowerCase();
  return t === "input" ? !!Mh[e.type] : t === "textarea";
}
function qc(e, t, n, r) {
  Ac(r), t = Wo(t, "onChange"), 0 < t.length && (n = new As("onChange", "change", null, n, r), e.push({ event: n, listeners: t }));
}
var hr = null, Rr = null;
function Fh(e) {
  cd(e, 0);
}
function pl(e) {
  var t = xn(e);
  if (Cc(t))
    return e;
}
function $h(e, t) {
  if (e === "change")
    return t;
}
var ed = !1;
if (mt) {
  var Bl;
  if (mt) {
    var Hl = "oninput" in document;
    if (!Hl) {
      var Qa = document.createElement("div");
      Qa.setAttribute("oninput", "return;"), Hl = typeof Qa.oninput == "function";
    }
    Bl = Hl;
  } else
    Bl = !1;
  ed = Bl && (!document.documentMode || 9 < document.documentMode);
}
function Ya() {
  hr && (hr.detachEvent("onpropertychange", td), Rr = hr = null);
}
function td(e) {
  if (e.propertyName === "value" && pl(Rr)) {
    var t = [];
    qc(t, Rr, e, Es(e)), Ic(Fh, t);
  }
}
function Wh(e, t, n) {
  e === "focusin" ? (Ya(), hr = t, Rr = n, hr.attachEvent("onpropertychange", td)) : e === "focusout" && Ya();
}
function Vh(e) {
  if (e === "selectionchange" || e === "keyup" || e === "keydown")
    return pl(Rr);
}
function Uh(e, t) {
  if (e === "click")
    return pl(t);
}
function Bh(e, t) {
  if (e === "input" || e === "change")
    return pl(t);
}
function Hh(e, t) {
  return e === t && (e !== 0 || 1 / e === 1 / t) || e !== e && t !== t;
}
var Ze = typeof Object.is == "function" ? Object.is : Hh;
function Tr(e, t) {
  if (Ze(e, t))
    return !0;
  if (typeof e != "object" || e === null || typeof t != "object" || t === null)
    return !1;
  var n = Object.keys(e), r = Object.keys(t);
  if (n.length !== r.length)
    return !1;
  for (r = 0; r < n.length; r++) {
    var o = n[r];
    if (!gi.call(t, o) || !Ze(e[o], t[o]))
      return !1;
  }
  return !0;
}
function Ga(e) {
  for (; e && e.firstChild; )
    e = e.firstChild;
  return e;
}
function Ka(e, t) {
  var n = Ga(e);
  e = 0;
  for (var r; n; ) {
    if (n.nodeType === 3) {
      if (r = e + n.textContent.length, e <= t && r >= t)
        return { node: n, offset: t - e };
      e = r;
    }
    e: {
      for (; n; ) {
        if (n.nextSibling) {
          n = n.nextSibling;
          break e;
        }
        n = n.parentNode;
      }
      n = void 0;
    }
    n = Ga(n);
  }
}
function nd(e, t) {
  return e && t ? e === t ? !0 : e && e.nodeType === 3 ? !1 : t && t.nodeType === 3 ? nd(e, t.parentNode) : "contains" in e ? e.contains(t) : e.compareDocumentPosition ? !!(e.compareDocumentPosition(t) & 16) : !1 : !1;
}
function rd() {
  for (var e = window, t = Io(); t instanceof e.HTMLIFrameElement; ) {
    try {
      var n = typeof t.contentWindow.location.href == "string";
    } catch {
      n = !1;
    }
    if (n)
      e = t.contentWindow;
    else
      break;
    t = Io(e.document);
  }
  return t;
}
function bs(e) {
  var t = e && e.nodeName && e.nodeName.toLowerCase();
  return t && (t === "input" && (e.type === "text" || e.type === "search" || e.type === "tel" || e.type === "url" || e.type === "password") || t === "textarea" || e.contentEditable === "true");
}
function Qh(e) {
  var t = rd(), n = e.focusedElem, r = e.selectionRange;
  if (t !== n && n && n.ownerDocument && nd(n.ownerDocument.documentElement, n)) {
    if (r !== null && bs(n)) {
      if (t = r.start, e = r.end, e === void 0 && (e = t), "selectionStart" in n)
        n.selectionStart = t, n.selectionEnd = Math.min(e, n.value.length);
      else if (e = (t = n.ownerDocument || document) && t.defaultView || window, e.getSelection) {
        e = e.getSelection();
        var o = n.textContent.length, l = Math.min(r.start, o);
        r = r.end === void 0 ? l : Math.min(r.end, o), !e.extend && l > r && (o = r, r = l, l = o), o = Ka(n, l);
        var i = Ka(
          n,
          r
        );
        o && i && (e.rangeCount !== 1 || e.anchorNode !== o.node || e.anchorOffset !== o.offset || e.focusNode !== i.node || e.focusOffset !== i.offset) && (t = t.createRange(), t.setStart(o.node, o.offset), e.removeAllRanges(), l > r ? (e.addRange(t), e.extend(i.node, i.offset)) : (t.setEnd(i.node, i.offset), e.addRange(t)));
      }
    }
    for (t = [], e = n; e = e.parentNode; )
      e.nodeType === 1 && t.push({ element: e, left: e.scrollLeft, top: e.scrollTop });
    for (typeof n.focus == "function" && n.focus(), n = 0; n < t.length; n++)
      e = t[n], e.element.scrollLeft = e.left, e.element.scrollTop = e.top;
  }
}
var Yh = mt && "documentMode" in document && 11 >= document.documentMode, wn = null, Di = null, vr = null, zi = !1;
function Xa(e, t, n) {
  var r = n.window === n ? n.document : n.nodeType === 9 ? n : n.ownerDocument;
  zi || wn == null || wn !== Io(r) || (r = wn, "selectionStart" in r && bs(r) ? r = { start: r.selectionStart, end: r.selectionEnd } : (r = (r.ownerDocument && r.ownerDocument.defaultView || window).getSelection(), r = { anchorNode: r.anchorNode, anchorOffset: r.anchorOffset, focusNode: r.focusNode, focusOffset: r.focusOffset }), vr && Tr(vr, r) || (vr = r, r = Wo(Di, "onSelect"), 0 < r.length && (t = new As("onSelect", "select", null, t, n), e.push({ event: t, listeners: r }), t.target = wn)));
}
function ro(e, t) {
  var n = {};
  return n[e.toLowerCase()] = t.toLowerCase(), n["Webkit" + e] = "webkit" + t, n["Moz" + e] = "moz" + t, n;
}
var Sn = { animationend: ro("Animation", "AnimationEnd"), animationiteration: ro("Animation", "AnimationIteration"), animationstart: ro("Animation", "AnimationStart"), transitionend: ro("Transition", "TransitionEnd") }, Ql = {}, od = {};
mt && (od = document.createElement("div").style, "AnimationEvent" in window || (delete Sn.animationend.animation, delete Sn.animationiteration.animation, delete Sn.animationstart.animation), "TransitionEvent" in window || delete Sn.transitionend.transition);
function ml(e) {
  if (Ql[e])
    return Ql[e];
  if (!Sn[e])
    return e;
  var t = Sn[e], n;
  for (n in t)
    if (t.hasOwnProperty(n) && n in od)
      return Ql[e] = t[n];
  return e;
}
var ld = ml("animationend"), id = ml("animationiteration"), sd = ml("animationstart"), ad = ml("transitionend"), ud = /* @__PURE__ */ new Map(), Za = "abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
function Ut(e, t) {
  ud.set(e, t), an(t, [e]);
}
for (var Yl = 0; Yl < Za.length; Yl++) {
  var Gl = Za[Yl], Gh = Gl.toLowerCase(), Kh = Gl[0].toUpperCase() + Gl.slice(1);
  Ut(Gh, "on" + Kh);
}
Ut(ld, "onAnimationEnd");
Ut(id, "onAnimationIteration");
Ut(sd, "onAnimationStart");
Ut("dblclick", "onDoubleClick");
Ut("focusin", "onFocus");
Ut("focusout", "onBlur");
Ut(ad, "onTransitionEnd");
Ln("onMouseEnter", ["mouseout", "mouseover"]);
Ln("onMouseLeave", ["mouseout", "mouseover"]);
Ln("onPointerEnter", ["pointerout", "pointerover"]);
Ln("onPointerLeave", ["pointerout", "pointerover"]);
an("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" "));
an("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" "));
an("onBeforeInput", ["compositionend", "keypress", "textInput", "paste"]);
an("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" "));
an("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" "));
an("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
var sr = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "), Xh = new Set("cancel close invalid load scroll toggle".split(" ").concat(sr));
function Ja(e, t, n) {
  var r = e.type || "unknown-event";
  e.currentTarget = n, Gm(r, t, void 0, e), e.currentTarget = null;
}
function cd(e, t) {
  t = (t & 4) !== 0;
  for (var n = 0; n < e.length; n++) {
    var r = e[n], o = r.event;
    r = r.listeners;
    e: {
      var l = void 0;
      if (t)
        for (var i = r.length - 1; 0 <= i; i--) {
          var s = r[i], a = s.instance, u = s.currentTarget;
          if (s = s.listener, a !== l && o.isPropagationStopped())
            break e;
          Ja(o, s, u), l = a;
        }
      else
        for (i = 0; i < r.length; i++) {
          if (s = r[i], a = s.instance, u = s.currentTarget, s = s.listener, a !== l && o.isPropagationStopped())
            break e;
          Ja(o, s, u), l = a;
        }
    }
  }
  if (Do)
    throw e = Oi, Do = !1, Oi = null, e;
}
function V(e, t) {
  var n = t[Vi];
  n === void 0 && (n = t[Vi] = /* @__PURE__ */ new Set());
  var r = e + "__bubble";
  n.has(r) || (dd(t, e, 2, !1), n.add(r));
}
function Kl(e, t, n) {
  var r = 0;
  t && (r |= 4), dd(n, e, r, t);
}
var oo = "_reactListening" + Math.random().toString(36).slice(2);
function Ar(e) {
  if (!e[oo]) {
    e[oo] = !0, yc.forEach(function(n) {
      n !== "selectionchange" && (Xh.has(n) || Kl(n, !1, e), Kl(n, !0, e));
    });
    var t = e.nodeType === 9 ? e : e.ownerDocument;
    t === null || t[oo] || (t[oo] = !0, Kl("selectionchange", !1, t));
  }
}
function dd(e, t, n, r) {
  switch (Gc(t)) {
    case 1:
      var o = ch;
      break;
    case 4:
      o = dh;
      break;
    default:
      o = Rs;
  }
  n = o.bind(null, t, n, e), o = void 0, !ji || t !== "touchstart" && t !== "touchmove" && t !== "wheel" || (o = !0), r ? o !== void 0 ? e.addEventListener(t, n, { capture: !0, passive: o }) : e.addEventListener(t, n, !0) : o !== void 0 ? e.addEventListener(t, n, { passive: o }) : e.addEventListener(t, n, !1);
}
function Xl(e, t, n, r, o) {
  var l = r;
  if (!(t & 1) && !(t & 2) && r !== null)
    e:
      for (; ; ) {
        if (r === null)
          return;
        var i = r.tag;
        if (i === 3 || i === 4) {
          var s = r.stateNode.containerInfo;
          if (s === o || s.nodeType === 8 && s.parentNode === o)
            break;
          if (i === 4)
            for (i = r.return; i !== null; ) {
              var a = i.tag;
              if ((a === 3 || a === 4) && (a = i.stateNode.containerInfo, a === o || a.nodeType === 8 && a.parentNode === o))
                return;
              i = i.return;
            }
          for (; s !== null; ) {
            if (i = Kt(s), i === null)
              return;
            if (a = i.tag, a === 5 || a === 6) {
              r = l = i;
              continue e;
            }
            s = s.parentNode;
          }
        }
        r = r.return;
      }
  Ic(function() {
    var u = l, f = Es(n), m = [];
    e: {
      var p = ud.get(e);
      if (p !== void 0) {
        var w = As, x = e;
        switch (e) {
          case "keypress":
            if (Eo(n) === 0)
              break e;
          case "keydown":
          case "keyup":
            w = Nh;
            break;
          case "focusin":
            x = "focus", w = Ul;
            break;
          case "focusout":
            x = "blur", w = Ul;
            break;
          case "beforeblur":
          case "afterblur":
            w = Ul;
            break;
          case "click":
            if (n.button === 2)
              break e;
          case "auxclick":
          case "dblclick":
          case "mousedown":
          case "mousemove":
          case "mouseup":
          case "mouseout":
          case "mouseover":
          case "contextmenu":
            w = $a;
            break;
          case "drag":
          case "dragend":
          case "dragenter":
          case "dragexit":
          case "dragleave":
          case "dragover":
          case "dragstart":
          case "drop":
            w = mh;
            break;
          case "touchcancel":
          case "touchend":
          case "touchmove":
          case "touchstart":
            w = Th;
            break;
          case ld:
          case id:
          case sd:
            w = gh;
            break;
          case ad:
            w = jh;
            break;
          case "scroll":
            w = fh;
            break;
          case "wheel":
            w = bh;
            break;
          case "copy":
          case "cut":
          case "paste":
            w = wh;
            break;
          case "gotpointercapture":
          case "lostpointercapture":
          case "pointercancel":
          case "pointerdown":
          case "pointermove":
          case "pointerout":
          case "pointerover":
          case "pointerup":
            w = Va;
        }
        var y = (t & 4) !== 0, E = !y && e === "scroll", h = y ? p !== null ? p + "Capture" : null : p;
        y = [];
        for (var d = u, v; d !== null; ) {
          v = d;
          var S = v.stateNode;
          if (v.tag === 5 && S !== null && (v = S, h !== null && (S = Er(d, h), S != null && y.push(jr(d, S, v)))), E)
            break;
          d = d.return;
        }
        0 < y.length && (p = new w(p, x, null, n, f), m.push({ event: p, listeners: y }));
      }
    }
    if (!(t & 7)) {
      e: {
        if (p = e === "mouseover" || e === "pointerover", w = e === "mouseout" || e === "pointerout", p && n !== Ti && (x = n.relatedTarget || n.fromElement) && (Kt(x) || x[ht]))
          break e;
        if ((w || p) && (p = f.window === f ? f : (p = f.ownerDocument) ? p.defaultView || p.parentWindow : window, w ? (x = n.relatedTarget || n.toElement, w = u, x = x ? Kt(x) : null, x !== null && (E = un(x), x !== E || x.tag !== 5 && x.tag !== 6) && (x = null)) : (w = null, x = u), w !== x)) {
          if (y = $a, S = "onMouseLeave", h = "onMouseEnter", d = "mouse", (e === "pointerout" || e === "pointerover") && (y = Va, S = "onPointerLeave", h = "onPointerEnter", d = "pointer"), E = w == null ? p : xn(w), v = x == null ? p : xn(x), p = new y(S, d + "leave", w, n, f), p.target = E, p.relatedTarget = v, S = null, Kt(f) === u && (y = new y(h, d + "enter", x, n, f), y.target = v, y.relatedTarget = E, S = y), E = S, w && x)
            t: {
              for (y = w, h = x, d = 0, v = y; v; v = dn(v))
                d++;
              for (v = 0, S = h; S; S = dn(S))
                v++;
              for (; 0 < d - v; )
                y = dn(y), d--;
              for (; 0 < v - d; )
                h = dn(h), v--;
              for (; d--; ) {
                if (y === h || h !== null && y === h.alternate)
                  break t;
                y = dn(y), h = dn(h);
              }
              y = null;
            }
          else
            y = null;
          w !== null && qa(m, p, w, y, !1), x !== null && E !== null && qa(m, E, x, y, !0);
        }
      }
      e: {
        if (p = u ? xn(u) : window, w = p.nodeName && p.nodeName.toLowerCase(), w === "select" || w === "input" && p.type === "file")
          var P = $h;
        else if (Ha(p))
          if (ed)
            P = Bh;
          else {
            P = Vh;
            var R = Wh;
          }
        else
          (w = p.nodeName) && w.toLowerCase() === "input" && (p.type === "checkbox" || p.type === "radio") && (P = Uh);
        if (P && (P = P(e, u))) {
          qc(m, P, n, f);
          break e;
        }
        R && R(e, p, u), e === "focusout" && (R = p._wrapperState) && R.controlled && p.type === "number" && Ei(p, "number", p.value);
      }
      switch (R = u ? xn(u) : window, e) {
        case "focusin":
          (Ha(R) || R.contentEditable === "true") && (wn = R, Di = u, vr = null);
          break;
        case "focusout":
          vr = Di = wn = null;
          break;
        case "mousedown":
          zi = !0;
          break;
        case "contextmenu":
        case "mouseup":
        case "dragend":
          zi = !1, Xa(m, n, f);
          break;
        case "selectionchange":
          if (Yh)
            break;
        case "keydown":
        case "keyup":
          Xa(m, n, f);
      }
      var N;
      if (Os)
        e: {
          switch (e) {
            case "compositionstart":
              var k = "onCompositionStart";
              break e;
            case "compositionend":
              k = "onCompositionEnd";
              break e;
            case "compositionupdate":
              k = "onCompositionUpdate";
              break e;
          }
          k = void 0;
        }
      else
        yn ? Zc(e, n) && (k = "onCompositionEnd") : e === "keydown" && n.keyCode === 229 && (k = "onCompositionStart");
      k && (Xc && n.locale !== "ko" && (yn || k !== "onCompositionStart" ? k === "onCompositionEnd" && yn && (N = Kc()) : (At = f, Ts = "value" in At ? At.value : At.textContent, yn = !0)), R = Wo(u, k), 0 < R.length && (k = new Wa(k, e, null, n, f), m.push({ event: k, listeners: R }), N ? k.data = N : (N = Jc(n), N !== null && (k.data = N)))), (N = Lh ? Dh(e, n) : zh(e, n)) && (u = Wo(u, "onBeforeInput"), 0 < u.length && (f = new Wa("onBeforeInput", "beforeinput", null, n, f), m.push({ event: f, listeners: u }), f.data = N));
    }
    cd(m, t);
  });
}
function jr(e, t, n) {
  return { instance: e, listener: t, currentTarget: n };
}
function Wo(e, t) {
  for (var n = t + "Capture", r = []; e !== null; ) {
    var o = e, l = o.stateNode;
    o.tag === 5 && l !== null && (o = l, l = Er(e, n), l != null && r.unshift(jr(e, l, o)), l = Er(e, t), l != null && r.push(jr(e, l, o))), e = e.return;
  }
  return r;
}
function dn(e) {
  if (e === null)
    return null;
  do
    e = e.return;
  while (e && e.tag !== 5);
  return e || null;
}
function qa(e, t, n, r, o) {
  for (var l = t._reactName, i = []; n !== null && n !== r; ) {
    var s = n, a = s.alternate, u = s.stateNode;
    if (a !== null && a === r)
      break;
    s.tag === 5 && u !== null && (s = u, o ? (a = Er(n, l), a != null && i.unshift(jr(n, a, s))) : o || (a = Er(n, l), a != null && i.push(jr(n, a, s)))), n = n.return;
  }
  i.length !== 0 && e.push({ event: t, listeners: i });
}
var Zh = /\r\n?/g, Jh = /\u0000|\uFFFD/g;
function eu(e) {
  return (typeof e == "string" ? e : "" + e).replace(Zh, `
`).replace(Jh, "");
}
function lo(e, t, n) {
  if (t = eu(t), eu(e) !== t && n)
    throw Error(_(425));
}
function Vo() {
}
var Mi = null, Fi = null;
function $i(e, t) {
  return e === "textarea" || e === "noscript" || typeof t.children == "string" || typeof t.children == "number" || typeof t.dangerouslySetInnerHTML == "object" && t.dangerouslySetInnerHTML !== null && t.dangerouslySetInnerHTML.__html != null;
}
var Wi = typeof setTimeout == "function" ? setTimeout : void 0, qh = typeof clearTimeout == "function" ? clearTimeout : void 0, tu = typeof Promise == "function" ? Promise : void 0, ev = typeof queueMicrotask == "function" ? queueMicrotask : typeof tu < "u" ? function(e) {
  return tu.resolve(null).then(e).catch(tv);
} : Wi;
function tv(e) {
  setTimeout(function() {
    throw e;
  });
}
function Zl(e, t) {
  var n = t, r = 0;
  do {
    var o = n.nextSibling;
    if (e.removeChild(n), o && o.nodeType === 8)
      if (n = o.data, n === "/$") {
        if (r === 0) {
          e.removeChild(o), _r(t);
          return;
        }
        r--;
      } else
        n !== "$" && n !== "$?" && n !== "$!" || r++;
    n = o;
  } while (n);
  _r(t);
}
function Lt(e) {
  for (; e != null; e = e.nextSibling) {
    var t = e.nodeType;
    if (t === 1 || t === 3)
      break;
    if (t === 8) {
      if (t = e.data, t === "$" || t === "$!" || t === "$?")
        break;
      if (t === "/$")
        return null;
    }
  }
  return e;
}
function nu(e) {
  e = e.previousSibling;
  for (var t = 0; e; ) {
    if (e.nodeType === 8) {
      var n = e.data;
      if (n === "$" || n === "$!" || n === "$?") {
        if (t === 0)
          return e;
        t--;
      } else
        n === "/$" && t++;
    }
    e = e.previousSibling;
  }
  return null;
}
var Hn = Math.random().toString(36).slice(2), rt = "__reactFiber$" + Hn, Or = "__reactProps$" + Hn, ht = "__reactContainer$" + Hn, Vi = "__reactEvents$" + Hn, nv = "__reactListeners$" + Hn, rv = "__reactHandles$" + Hn;
function Kt(e) {
  var t = e[rt];
  if (t)
    return t;
  for (var n = e.parentNode; n; ) {
    if (t = n[ht] || n[rt]) {
      if (n = t.alternate, t.child !== null || n !== null && n.child !== null)
        for (e = nu(e); e !== null; ) {
          if (n = e[rt])
            return n;
          e = nu(e);
        }
      return t;
    }
    e = n, n = e.parentNode;
  }
  return null;
}
function Vr(e) {
  return e = e[rt] || e[ht], !e || e.tag !== 5 && e.tag !== 6 && e.tag !== 13 && e.tag !== 3 ? null : e;
}
function xn(e) {
  if (e.tag === 5 || e.tag === 6)
    return e.stateNode;
  throw Error(_(33));
}
function hl(e) {
  return e[Or] || null;
}
var Ui = [], kn = -1;
function Bt(e) {
  return { current: e };
}
function U(e) {
  0 > kn || (e.current = Ui[kn], Ui[kn] = null, kn--);
}
function W(e, t) {
  kn++, Ui[kn] = e.current, e.current = t;
}
var Wt = {}, ye = Bt(Wt), Ne = Bt(!1), tn = Wt;
function Dn(e, t) {
  var n = e.type.contextTypes;
  if (!n)
    return Wt;
  var r = e.stateNode;
  if (r && r.__reactInternalMemoizedUnmaskedChildContext === t)
    return r.__reactInternalMemoizedMaskedChildContext;
  var o = {}, l;
  for (l in n)
    o[l] = t[l];
  return r && (e = e.stateNode, e.__reactInternalMemoizedUnmaskedChildContext = t, e.__reactInternalMemoizedMaskedChildContext = o), o;
}
function _e(e) {
  return e = e.childContextTypes, e != null;
}
function Uo() {
  U(Ne), U(ye);
}
function ru(e, t, n) {
  if (ye.current !== Wt)
    throw Error(_(168));
  W(ye, t), W(Ne, n);
}
function fd(e, t, n) {
  var r = e.stateNode;
  if (t = t.childContextTypes, typeof r.getChildContext != "function")
    return n;
  r = r.getChildContext();
  for (var o in r)
    if (!(o in t))
      throw Error(_(108, Wm(e) || "Unknown", o));
  return K({}, n, r);
}
function Bo(e) {
  return e = (e = e.stateNode) && e.__reactInternalMemoizedMergedChildContext || Wt, tn = ye.current, W(ye, e), W(Ne, Ne.current), !0;
}
function ou(e, t, n) {
  var r = e.stateNode;
  if (!r)
    throw Error(_(169));
  n ? (e = fd(e, t, tn), r.__reactInternalMemoizedMergedChildContext = e, U(Ne), U(ye), W(ye, e)) : U(Ne), W(Ne, n);
}
var ct = null, vl = !1, Jl = !1;
function pd(e) {
  ct === null ? ct = [e] : ct.push(e);
}
function ov(e) {
  vl = !0, pd(e);
}
function Ht() {
  if (!Jl && ct !== null) {
    Jl = !0;
    var e = 0, t = F;
    try {
      var n = ct;
      for (F = 1; e < n.length; e++) {
        var r = n[e];
        do
          r = r(!0);
        while (r !== null);
      }
      ct = null, vl = !1;
    } catch (o) {
      throw ct !== null && (ct = ct.slice(e + 1)), Mc(Ps, Ht), o;
    } finally {
      F = t, Jl = !1;
    }
  }
  return null;
}
var Cn = [], En = 0, Ho = null, Qo = 0, De = [], ze = 0, nn = null, dt = 1, ft = "";
function Yt(e, t) {
  Cn[En++] = Qo, Cn[En++] = Ho, Ho = e, Qo = t;
}
function md(e, t, n) {
  De[ze++] = dt, De[ze++] = ft, De[ze++] = nn, nn = e;
  var r = dt;
  e = ft;
  var o = 32 - Ke(r) - 1;
  r &= ~(1 << o), n += 1;
  var l = 32 - Ke(t) + o;
  if (30 < l) {
    var i = o - o % 5;
    l = (r & (1 << i) - 1).toString(32), r >>= i, o -= i, dt = 1 << 32 - Ke(t) + o | n << o | r, ft = l + e;
  } else
    dt = 1 << l | n << o | r, ft = e;
}
function Is(e) {
  e.return !== null && (Yt(e, 1), md(e, 1, 0));
}
function Ls(e) {
  for (; e === Ho; )
    Ho = Cn[--En], Cn[En] = null, Qo = Cn[--En], Cn[En] = null;
  for (; e === nn; )
    nn = De[--ze], De[ze] = null, ft = De[--ze], De[ze] = null, dt = De[--ze], De[ze] = null;
}
var Oe = null, je = null, H = !1, Ge = null;
function hd(e, t) {
  var n = Fe(5, null, null, 0);
  n.elementType = "DELETED", n.stateNode = t, n.return = e, t = e.deletions, t === null ? (e.deletions = [n], e.flags |= 16) : t.push(n);
}
function lu(e, t) {
  switch (e.tag) {
    case 5:
      var n = e.type;
      return t = t.nodeType !== 1 || n.toLowerCase() !== t.nodeName.toLowerCase() ? null : t, t !== null ? (e.stateNode = t, Oe = e, je = Lt(t.firstChild), !0) : !1;
    case 6:
      return t = e.pendingProps === "" || t.nodeType !== 3 ? null : t, t !== null ? (e.stateNode = t, Oe = e, je = null, !0) : !1;
    case 13:
      return t = t.nodeType !== 8 ? null : t, t !== null ? (n = nn !== null ? { id: dt, overflow: ft } : null, e.memoizedState = { dehydrated: t, treeContext: n, retryLane: 1073741824 }, n = Fe(18, null, null, 0), n.stateNode = t, n.return = e, e.child = n, Oe = e, je = null, !0) : !1;
    default:
      return !1;
  }
}
function Bi(e) {
  return (e.mode & 1) !== 0 && (e.flags & 128) === 0;
}
function Hi(e) {
  if (H) {
    var t = je;
    if (t) {
      var n = t;
      if (!lu(e, t)) {
        if (Bi(e))
          throw Error(_(418));
        t = Lt(n.nextSibling);
        var r = Oe;
        t && lu(e, t) ? hd(r, n) : (e.flags = e.flags & -4097 | 2, H = !1, Oe = e);
      }
    } else {
      if (Bi(e))
        throw Error(_(418));
      e.flags = e.flags & -4097 | 2, H = !1, Oe = e;
    }
  }
}
function iu(e) {
  for (e = e.return; e !== null && e.tag !== 5 && e.tag !== 3 && e.tag !== 13; )
    e = e.return;
  Oe = e;
}
function io(e) {
  if (e !== Oe)
    return !1;
  if (!H)
    return iu(e), H = !0, !1;
  var t;
  if ((t = e.tag !== 3) && !(t = e.tag !== 5) && (t = e.type, t = t !== "head" && t !== "body" && !$i(e.type, e.memoizedProps)), t && (t = je)) {
    if (Bi(e))
      throw vd(), Error(_(418));
    for (; t; )
      hd(e, t), t = Lt(t.nextSibling);
  }
  if (iu(e), e.tag === 13) {
    if (e = e.memoizedState, e = e !== null ? e.dehydrated : null, !e)
      throw Error(_(317));
    e: {
      for (e = e.nextSibling, t = 0; e; ) {
        if (e.nodeType === 8) {
          var n = e.data;
          if (n === "/$") {
            if (t === 0) {
              je = Lt(e.nextSibling);
              break e;
            }
            t--;
          } else
            n !== "$" && n !== "$!" && n !== "$?" || t++;
        }
        e = e.nextSibling;
      }
      je = null;
    }
  } else
    je = Oe ? Lt(e.stateNode.nextSibling) : null;
  return !0;
}
function vd() {
  for (var e = je; e; )
    e = Lt(e.nextSibling);
}
function zn() {
  je = Oe = null, H = !1;
}
function Ds(e) {
  Ge === null ? Ge = [e] : Ge.push(e);
}
var lv = yt.ReactCurrentBatchConfig;
function er(e, t, n) {
  if (e = n.ref, e !== null && typeof e != "function" && typeof e != "object") {
    if (n._owner) {
      if (n = n._owner, n) {
        if (n.tag !== 1)
          throw Error(_(309));
        var r = n.stateNode;
      }
      if (!r)
        throw Error(_(147, e));
      var o = r, l = "" + e;
      return t !== null && t.ref !== null && typeof t.ref == "function" && t.ref._stringRef === l ? t.ref : (t = function(i) {
        var s = o.refs;
        i === null ? delete s[l] : s[l] = i;
      }, t._stringRef = l, t);
    }
    if (typeof e != "string")
      throw Error(_(284));
    if (!n._owner)
      throw Error(_(290, e));
  }
  return e;
}
function so(e, t) {
  throw e = Object.prototype.toString.call(t), Error(_(31, e === "[object Object]" ? "object with keys {" + Object.keys(t).join(", ") + "}" : e));
}
function su(e) {
  var t = e._init;
  return t(e._payload);
}
function gd(e) {
  function t(h, d) {
    if (e) {
      var v = h.deletions;
      v === null ? (h.deletions = [d], h.flags |= 16) : v.push(d);
    }
  }
  function n(h, d) {
    if (!e)
      return null;
    for (; d !== null; )
      t(h, d), d = d.sibling;
    return null;
  }
  function r(h, d) {
    for (h = /* @__PURE__ */ new Map(); d !== null; )
      d.key !== null ? h.set(d.key, d) : h.set(d.index, d), d = d.sibling;
    return h;
  }
  function o(h, d) {
    return h = Ft(h, d), h.index = 0, h.sibling = null, h;
  }
  function l(h, d, v) {
    return h.index = v, e ? (v = h.alternate, v !== null ? (v = v.index, v < d ? (h.flags |= 2, d) : v) : (h.flags |= 2, d)) : (h.flags |= 1048576, d);
  }
  function i(h) {
    return e && h.alternate === null && (h.flags |= 2), h;
  }
  function s(h, d, v, S) {
    return d === null || d.tag !== 6 ? (d = li(v, h.mode, S), d.return = h, d) : (d = o(d, v), d.return = h, d);
  }
  function a(h, d, v, S) {
    var P = v.type;
    return P === gn ? f(h, d, v.props.children, S, v.key) : d !== null && (d.elementType === P || typeof P == "object" && P !== null && P.$$typeof === Nt && su(P) === d.type) ? (S = o(d, v.props), S.ref = er(h, d, v), S.return = h, S) : (S = jo(v.type, v.key, v.props, null, h.mode, S), S.ref = er(h, d, v), S.return = h, S);
  }
  function u(h, d, v, S) {
    return d === null || d.tag !== 4 || d.stateNode.containerInfo !== v.containerInfo || d.stateNode.implementation !== v.implementation ? (d = ii(v, h.mode, S), d.return = h, d) : (d = o(d, v.children || []), d.return = h, d);
  }
  function f(h, d, v, S, P) {
    return d === null || d.tag !== 7 ? (d = qt(v, h.mode, S, P), d.return = h, d) : (d = o(d, v), d.return = h, d);
  }
  function m(h, d, v) {
    if (typeof d == "string" && d !== "" || typeof d == "number")
      return d = li("" + d, h.mode, v), d.return = h, d;
    if (typeof d == "object" && d !== null) {
      switch (d.$$typeof) {
        case Xr:
          return v = jo(d.type, d.key, d.props, null, h.mode, v), v.ref = er(h, null, d), v.return = h, v;
        case vn:
          return d = ii(d, h.mode, v), d.return = h, d;
        case Nt:
          var S = d._init;
          return m(h, S(d._payload), v);
      }
      if (lr(d) || Kn(d))
        return d = qt(d, h.mode, v, null), d.return = h, d;
      so(h, d);
    }
    return null;
  }
  function p(h, d, v, S) {
    var P = d !== null ? d.key : null;
    if (typeof v == "string" && v !== "" || typeof v == "number")
      return P !== null ? null : s(h, d, "" + v, S);
    if (typeof v == "object" && v !== null) {
      switch (v.$$typeof) {
        case Xr:
          return v.key === P ? a(h, d, v, S) : null;
        case vn:
          return v.key === P ? u(h, d, v, S) : null;
        case Nt:
          return P = v._init, p(
            h,
            d,
            P(v._payload),
            S
          );
      }
      if (lr(v) || Kn(v))
        return P !== null ? null : f(h, d, v, S, null);
      so(h, v);
    }
    return null;
  }
  function w(h, d, v, S, P) {
    if (typeof S == "string" && S !== "" || typeof S == "number")
      return h = h.get(v) || null, s(d, h, "" + S, P);
    if (typeof S == "object" && S !== null) {
      switch (S.$$typeof) {
        case Xr:
          return h = h.get(S.key === null ? v : S.key) || null, a(d, h, S, P);
        case vn:
          return h = h.get(S.key === null ? v : S.key) || null, u(d, h, S, P);
        case Nt:
          var R = S._init;
          return w(h, d, v, R(S._payload), P);
      }
      if (lr(S) || Kn(S))
        return h = h.get(v) || null, f(d, h, S, P, null);
      so(d, S);
    }
    return null;
  }
  function x(h, d, v, S) {
    for (var P = null, R = null, N = d, k = d = 0, O = null; N !== null && k < v.length; k++) {
      N.index > k ? (O = N, N = null) : O = N.sibling;
      var b = p(h, N, v[k], S);
      if (b === null) {
        N === null && (N = O);
        break;
      }
      e && N && b.alternate === null && t(h, N), d = l(b, d, k), R === null ? P = b : R.sibling = b, R = b, N = O;
    }
    if (k === v.length)
      return n(h, N), H && Yt(h, k), P;
    if (N === null) {
      for (; k < v.length; k++)
        N = m(h, v[k], S), N !== null && (d = l(N, d, k), R === null ? P = N : R.sibling = N, R = N);
      return H && Yt(h, k), P;
    }
    for (N = r(h, N); k < v.length; k++)
      O = w(N, h, k, v[k], S), O !== null && (e && O.alternate !== null && N.delete(O.key === null ? k : O.key), d = l(O, d, k), R === null ? P = O : R.sibling = O, R = O);
    return e && N.forEach(function($) {
      return t(h, $);
    }), H && Yt(h, k), P;
  }
  function y(h, d, v, S) {
    var P = Kn(v);
    if (typeof P != "function")
      throw Error(_(150));
    if (v = P.call(v), v == null)
      throw Error(_(151));
    for (var R = P = null, N = d, k = d = 0, O = null, b = v.next(); N !== null && !b.done; k++, b = v.next()) {
      N.index > k ? (O = N, N = null) : O = N.sibling;
      var $ = p(h, N, b.value, S);
      if ($ === null) {
        N === null && (N = O);
        break;
      }
      e && N && $.alternate === null && t(h, N), d = l($, d, k), R === null ? P = $ : R.sibling = $, R = $, N = O;
    }
    if (b.done)
      return n(
        h,
        N
      ), H && Yt(h, k), P;
    if (N === null) {
      for (; !b.done; k++, b = v.next())
        b = m(h, b.value, S), b !== null && (d = l(b, d, k), R === null ? P = b : R.sibling = b, R = b);
      return H && Yt(h, k), P;
    }
    for (N = r(h, N); !b.done; k++, b = v.next())
      b = w(N, h, k, b.value, S), b !== null && (e && b.alternate !== null && N.delete(b.key === null ? k : b.key), d = l(b, d, k), R === null ? P = b : R.sibling = b, R = b);
    return e && N.forEach(function(Ce) {
      return t(h, Ce);
    }), H && Yt(h, k), P;
  }
  function E(h, d, v, S) {
    if (typeof v == "object" && v !== null && v.type === gn && v.key === null && (v = v.props.children), typeof v == "object" && v !== null) {
      switch (v.$$typeof) {
        case Xr:
          e: {
            for (var P = v.key, R = d; R !== null; ) {
              if (R.key === P) {
                if (P = v.type, P === gn) {
                  if (R.tag === 7) {
                    n(h, R.sibling), d = o(R, v.props.children), d.return = h, h = d;
                    break e;
                  }
                } else if (R.elementType === P || typeof P == "object" && P !== null && P.$$typeof === Nt && su(P) === R.type) {
                  n(h, R.sibling), d = o(R, v.props), d.ref = er(h, R, v), d.return = h, h = d;
                  break e;
                }
                n(h, R);
                break;
              } else
                t(h, R);
              R = R.sibling;
            }
            v.type === gn ? (d = qt(v.props.children, h.mode, S, v.key), d.return = h, h = d) : (S = jo(v.type, v.key, v.props, null, h.mode, S), S.ref = er(h, d, v), S.return = h, h = S);
          }
          return i(h);
        case vn:
          e: {
            for (R = v.key; d !== null; ) {
              if (d.key === R)
                if (d.tag === 4 && d.stateNode.containerInfo === v.containerInfo && d.stateNode.implementation === v.implementation) {
                  n(h, d.sibling), d = o(d, v.children || []), d.return = h, h = d;
                  break e;
                } else {
                  n(h, d);
                  break;
                }
              else
                t(h, d);
              d = d.sibling;
            }
            d = ii(v, h.mode, S), d.return = h, h = d;
          }
          return i(h);
        case Nt:
          return R = v._init, E(h, d, R(v._payload), S);
      }
      if (lr(v))
        return x(h, d, v, S);
      if (Kn(v))
        return y(h, d, v, S);
      so(h, v);
    }
    return typeof v == "string" && v !== "" || typeof v == "number" ? (v = "" + v, d !== null && d.tag === 6 ? (n(h, d.sibling), d = o(d, v), d.return = h, h = d) : (n(h, d), d = li(v, h.mode, S), d.return = h, h = d), i(h)) : n(h, d);
  }
  return E;
}
var Mn = gd(!0), yd = gd(!1), Yo = Bt(null), Go = null, Pn = null, zs = null;
function Ms() {
  zs = Pn = Go = null;
}
function Fs(e) {
  var t = Yo.current;
  U(Yo), e._currentValue = t;
}
function Qi(e, t, n) {
  for (; e !== null; ) {
    var r = e.alternate;
    if ((e.childLanes & t) !== t ? (e.childLanes |= t, r !== null && (r.childLanes |= t)) : r !== null && (r.childLanes & t) !== t && (r.childLanes |= t), e === n)
      break;
    e = e.return;
  }
}
function On(e, t) {
  Go = e, zs = Pn = null, e = e.dependencies, e !== null && e.firstContext !== null && (e.lanes & t && (Pe = !0), e.firstContext = null);
}
function We(e) {
  var t = e._currentValue;
  if (zs !== e)
    if (e = { context: e, memoizedValue: t, next: null }, Pn === null) {
      if (Go === null)
        throw Error(_(308));
      Pn = e, Go.dependencies = { lanes: 0, firstContext: e };
    } else
      Pn = Pn.next = e;
  return t;
}
var Xt = null;
function $s(e) {
  Xt === null ? Xt = [e] : Xt.push(e);
}
function wd(e, t, n, r) {
  var o = t.interleaved;
  return o === null ? (n.next = n, $s(t)) : (n.next = o.next, o.next = n), t.interleaved = n, vt(e, r);
}
function vt(e, t) {
  e.lanes |= t;
  var n = e.alternate;
  for (n !== null && (n.lanes |= t), n = e, e = e.return; e !== null; )
    e.childLanes |= t, n = e.alternate, n !== null && (n.childLanes |= t), n = e, e = e.return;
  return n.tag === 3 ? n.stateNode : null;
}
var _t = !1;
function Ws(e) {
  e.updateQueue = { baseState: e.memoizedState, firstBaseUpdate: null, lastBaseUpdate: null, shared: { pending: null, interleaved: null, lanes: 0 }, effects: null };
}
function Sd(e, t) {
  e = e.updateQueue, t.updateQueue === e && (t.updateQueue = { baseState: e.baseState, firstBaseUpdate: e.firstBaseUpdate, lastBaseUpdate: e.lastBaseUpdate, shared: e.shared, effects: e.effects });
}
function pt(e, t) {
  return { eventTime: e, lane: t, tag: 0, payload: null, callback: null, next: null };
}
function Dt(e, t, n) {
  var r = e.updateQueue;
  if (r === null)
    return null;
  if (r = r.shared, M & 2) {
    var o = r.pending;
    return o === null ? t.next = t : (t.next = o.next, o.next = t), r.pending = t, vt(e, n);
  }
  return o = r.interleaved, o === null ? (t.next = t, $s(r)) : (t.next = o.next, o.next = t), r.interleaved = t, vt(e, n);
}
function Po(e, t, n) {
  if (t = t.updateQueue, t !== null && (t = t.shared, (n & 4194240) !== 0)) {
    var r = t.lanes;
    r &= e.pendingLanes, n |= r, t.lanes = n, Ns(e, n);
  }
}
function au(e, t) {
  var n = e.updateQueue, r = e.alternate;
  if (r !== null && (r = r.updateQueue, n === r)) {
    var o = null, l = null;
    if (n = n.firstBaseUpdate, n !== null) {
      do {
        var i = { eventTime: n.eventTime, lane: n.lane, tag: n.tag, payload: n.payload, callback: n.callback, next: null };
        l === null ? o = l = i : l = l.next = i, n = n.next;
      } while (n !== null);
      l === null ? o = l = t : l = l.next = t;
    } else
      o = l = t;
    n = { baseState: r.baseState, firstBaseUpdate: o, lastBaseUpdate: l, shared: r.shared, effects: r.effects }, e.updateQueue = n;
    return;
  }
  e = n.lastBaseUpdate, e === null ? n.firstBaseUpdate = t : e.next = t, n.lastBaseUpdate = t;
}
function Ko(e, t, n, r) {
  var o = e.updateQueue;
  _t = !1;
  var l = o.firstBaseUpdate, i = o.lastBaseUpdate, s = o.shared.pending;
  if (s !== null) {
    o.shared.pending = null;
    var a = s, u = a.next;
    a.next = null, i === null ? l = u : i.next = u, i = a;
    var f = e.alternate;
    f !== null && (f = f.updateQueue, s = f.lastBaseUpdate, s !== i && (s === null ? f.firstBaseUpdate = u : s.next = u, f.lastBaseUpdate = a));
  }
  if (l !== null) {
    var m = o.baseState;
    i = 0, f = u = a = null, s = l;
    do {
      var p = s.lane, w = s.eventTime;
      if ((r & p) === p) {
        f !== null && (f = f.next = {
          eventTime: w,
          lane: 0,
          tag: s.tag,
          payload: s.payload,
          callback: s.callback,
          next: null
        });
        e: {
          var x = e, y = s;
          switch (p = t, w = n, y.tag) {
            case 1:
              if (x = y.payload, typeof x == "function") {
                m = x.call(w, m, p);
                break e;
              }
              m = x;
              break e;
            case 3:
              x.flags = x.flags & -65537 | 128;
            case 0:
              if (x = y.payload, p = typeof x == "function" ? x.call(w, m, p) : x, p == null)
                break e;
              m = K({}, m, p);
              break e;
            case 2:
              _t = !0;
          }
        }
        s.callback !== null && s.lane !== 0 && (e.flags |= 64, p = o.effects, p === null ? o.effects = [s] : p.push(s));
      } else
        w = { eventTime: w, lane: p, tag: s.tag, payload: s.payload, callback: s.callback, next: null }, f === null ? (u = f = w, a = m) : f = f.next = w, i |= p;
      if (s = s.next, s === null) {
        if (s = o.shared.pending, s === null)
          break;
        p = s, s = p.next, p.next = null, o.lastBaseUpdate = p, o.shared.pending = null;
      }
    } while (1);
    if (f === null && (a = m), o.baseState = a, o.firstBaseUpdate = u, o.lastBaseUpdate = f, t = o.shared.interleaved, t !== null) {
      o = t;
      do
        i |= o.lane, o = o.next;
      while (o !== t);
    } else
      l === null && (o.shared.lanes = 0);
    on |= i, e.lanes = i, e.memoizedState = m;
  }
}
function uu(e, t, n) {
  if (e = t.effects, t.effects = null, e !== null)
    for (t = 0; t < e.length; t++) {
      var r = e[t], o = r.callback;
      if (o !== null) {
        if (r.callback = null, r = n, typeof o != "function")
          throw Error(_(191, o));
        o.call(r);
      }
    }
}
var Ur = {}, it = Bt(Ur), br = Bt(Ur), Ir = Bt(Ur);
function Zt(e) {
  if (e === Ur)
    throw Error(_(174));
  return e;
}
function Vs(e, t) {
  switch (W(Ir, t), W(br, e), W(it, Ur), e = t.nodeType, e) {
    case 9:
    case 11:
      t = (t = t.documentElement) ? t.namespaceURI : Ni(null, "");
      break;
    default:
      e = e === 8 ? t.parentNode : t, t = e.namespaceURI || null, e = e.tagName, t = Ni(t, e);
  }
  U(it), W(it, t);
}
function Fn() {
  U(it), U(br), U(Ir);
}
function xd(e) {
  Zt(Ir.current);
  var t = Zt(it.current), n = Ni(t, e.type);
  t !== n && (W(br, e), W(it, n));
}
function Us(e) {
  br.current === e && (U(it), U(br));
}
var Y = Bt(0);
function Xo(e) {
  for (var t = e; t !== null; ) {
    if (t.tag === 13) {
      var n = t.memoizedState;
      if (n !== null && (n = n.dehydrated, n === null || n.data === "$?" || n.data === "$!"))
        return t;
    } else if (t.tag === 19 && t.memoizedProps.revealOrder !== void 0) {
      if (t.flags & 128)
        return t;
    } else if (t.child !== null) {
      t.child.return = t, t = t.child;
      continue;
    }
    if (t === e)
      break;
    for (; t.sibling === null; ) {
      if (t.return === null || t.return === e)
        return null;
      t = t.return;
    }
    t.sibling.return = t.return, t = t.sibling;
  }
  return null;
}
var ql = [];
function Bs() {
  for (var e = 0; e < ql.length; e++)
    ql[e]._workInProgressVersionPrimary = null;
  ql.length = 0;
}
var No = yt.ReactCurrentDispatcher, ei = yt.ReactCurrentBatchConfig, rn = 0, G = null, ie = null, ue = null, Zo = !1, gr = !1, Lr = 0, iv = 0;
function he() {
  throw Error(_(321));
}
function Hs(e, t) {
  if (t === null)
    return !1;
  for (var n = 0; n < t.length && n < e.length; n++)
    if (!Ze(e[n], t[n]))
      return !1;
  return !0;
}
function Qs(e, t, n, r, o, l) {
  if (rn = l, G = t, t.memoizedState = null, t.updateQueue = null, t.lanes = 0, No.current = e === null || e.memoizedState === null ? cv : dv, e = n(r, o), gr) {
    l = 0;
    do {
      if (gr = !1, Lr = 0, 25 <= l)
        throw Error(_(301));
      l += 1, ue = ie = null, t.updateQueue = null, No.current = fv, e = n(r, o);
    } while (gr);
  }
  if (No.current = Jo, t = ie !== null && ie.next !== null, rn = 0, ue = ie = G = null, Zo = !1, t)
    throw Error(_(300));
  return e;
}
function Ys() {
  var e = Lr !== 0;
  return Lr = 0, e;
}
function nt() {
  var e = { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null };
  return ue === null ? G.memoizedState = ue = e : ue = ue.next = e, ue;
}
function Ve() {
  if (ie === null) {
    var e = G.alternate;
    e = e !== null ? e.memoizedState : null;
  } else
    e = ie.next;
  var t = ue === null ? G.memoizedState : ue.next;
  if (t !== null)
    ue = t, ie = e;
  else {
    if (e === null)
      throw Error(_(310));
    ie = e, e = { memoizedState: ie.memoizedState, baseState: ie.baseState, baseQueue: ie.baseQueue, queue: ie.queue, next: null }, ue === null ? G.memoizedState = ue = e : ue = ue.next = e;
  }
  return ue;
}
function Dr(e, t) {
  return typeof t == "function" ? t(e) : t;
}
function ti(e) {
  var t = Ve(), n = t.queue;
  if (n === null)
    throw Error(_(311));
  n.lastRenderedReducer = e;
  var r = ie, o = r.baseQueue, l = n.pending;
  if (l !== null) {
    if (o !== null) {
      var i = o.next;
      o.next = l.next, l.next = i;
    }
    r.baseQueue = o = l, n.pending = null;
  }
  if (o !== null) {
    l = o.next, r = r.baseState;
    var s = i = null, a = null, u = l;
    do {
      var f = u.lane;
      if ((rn & f) === f)
        a !== null && (a = a.next = { lane: 0, action: u.action, hasEagerState: u.hasEagerState, eagerState: u.eagerState, next: null }), r = u.hasEagerState ? u.eagerState : e(r, u.action);
      else {
        var m = {
          lane: f,
          action: u.action,
          hasEagerState: u.hasEagerState,
          eagerState: u.eagerState,
          next: null
        };
        a === null ? (s = a = m, i = r) : a = a.next = m, G.lanes |= f, on |= f;
      }
      u = u.next;
    } while (u !== null && u !== l);
    a === null ? i = r : a.next = s, Ze(r, t.memoizedState) || (Pe = !0), t.memoizedState = r, t.baseState = i, t.baseQueue = a, n.lastRenderedState = r;
  }
  if (e = n.interleaved, e !== null) {
    o = e;
    do
      l = o.lane, G.lanes |= l, on |= l, o = o.next;
    while (o !== e);
  } else
    o === null && (n.lanes = 0);
  return [t.memoizedState, n.dispatch];
}
function ni(e) {
  var t = Ve(), n = t.queue;
  if (n === null)
    throw Error(_(311));
  n.lastRenderedReducer = e;
  var r = n.dispatch, o = n.pending, l = t.memoizedState;
  if (o !== null) {
    n.pending = null;
    var i = o = o.next;
    do
      l = e(l, i.action), i = i.next;
    while (i !== o);
    Ze(l, t.memoizedState) || (Pe = !0), t.memoizedState = l, t.baseQueue === null && (t.baseState = l), n.lastRenderedState = l;
  }
  return [l, r];
}
function kd() {
}
function Cd(e, t) {
  var n = G, r = Ve(), o = t(), l = !Ze(r.memoizedState, o);
  if (l && (r.memoizedState = o, Pe = !0), r = r.queue, Gs(Nd.bind(null, n, r, e), [e]), r.getSnapshot !== t || l || ue !== null && ue.memoizedState.tag & 1) {
    if (n.flags |= 2048, zr(9, Pd.bind(null, n, r, o, t), void 0, null), ce === null)
      throw Error(_(349));
    rn & 30 || Ed(n, t, o);
  }
  return o;
}
function Ed(e, t, n) {
  e.flags |= 16384, e = { getSnapshot: t, value: n }, t = G.updateQueue, t === null ? (t = { lastEffect: null, stores: null }, G.updateQueue = t, t.stores = [e]) : (n = t.stores, n === null ? t.stores = [e] : n.push(e));
}
function Pd(e, t, n, r) {
  t.value = n, t.getSnapshot = r, _d(t) && Rd(e);
}
function Nd(e, t, n) {
  return n(function() {
    _d(t) && Rd(e);
  });
}
function _d(e) {
  var t = e.getSnapshot;
  e = e.value;
  try {
    var n = t();
    return !Ze(e, n);
  } catch {
    return !0;
  }
}
function Rd(e) {
  var t = vt(e, 1);
  t !== null && Xe(t, e, 1, -1);
}
function cu(e) {
  var t = nt();
  return typeof e == "function" && (e = e()), t.memoizedState = t.baseState = e, e = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: Dr, lastRenderedState: e }, t.queue = e, e = e.dispatch = uv.bind(null, G, e), [t.memoizedState, e];
}
function zr(e, t, n, r) {
  return e = { tag: e, create: t, destroy: n, deps: r, next: null }, t = G.updateQueue, t === null ? (t = { lastEffect: null, stores: null }, G.updateQueue = t, t.lastEffect = e.next = e) : (n = t.lastEffect, n === null ? t.lastEffect = e.next = e : (r = n.next, n.next = e, e.next = r, t.lastEffect = e)), e;
}
function Td() {
  return Ve().memoizedState;
}
function _o(e, t, n, r) {
  var o = nt();
  G.flags |= e, o.memoizedState = zr(1 | t, n, void 0, r === void 0 ? null : r);
}
function gl(e, t, n, r) {
  var o = Ve();
  r = r === void 0 ? null : r;
  var l = void 0;
  if (ie !== null) {
    var i = ie.memoizedState;
    if (l = i.destroy, r !== null && Hs(r, i.deps)) {
      o.memoizedState = zr(t, n, l, r);
      return;
    }
  }
  G.flags |= e, o.memoizedState = zr(1 | t, n, l, r);
}
function du(e, t) {
  return _o(8390656, 8, e, t);
}
function Gs(e, t) {
  return gl(2048, 8, e, t);
}
function Ad(e, t) {
  return gl(4, 2, e, t);
}
function jd(e, t) {
  return gl(4, 4, e, t);
}
function Od(e, t) {
  if (typeof t == "function")
    return e = e(), t(e), function() {
      t(null);
    };
  if (t != null)
    return e = e(), t.current = e, function() {
      t.current = null;
    };
}
function bd(e, t, n) {
  return n = n != null ? n.concat([e]) : null, gl(4, 4, Od.bind(null, t, e), n);
}
function Ks() {
}
function Id(e, t) {
  var n = Ve();
  t = t === void 0 ? null : t;
  var r = n.memoizedState;
  return r !== null && t !== null && Hs(t, r[1]) ? r[0] : (n.memoizedState = [e, t], e);
}
function Ld(e, t) {
  var n = Ve();
  t = t === void 0 ? null : t;
  var r = n.memoizedState;
  return r !== null && t !== null && Hs(t, r[1]) ? r[0] : (e = e(), n.memoizedState = [e, t], e);
}
function Dd(e, t, n) {
  return rn & 21 ? (Ze(n, t) || (n = Wc(), G.lanes |= n, on |= n, e.baseState = !0), t) : (e.baseState && (e.baseState = !1, Pe = !0), e.memoizedState = n);
}
function sv(e, t) {
  var n = F;
  F = n !== 0 && 4 > n ? n : 4, e(!0);
  var r = ei.transition;
  ei.transition = {};
  try {
    e(!1), t();
  } finally {
    F = n, ei.transition = r;
  }
}
function zd() {
  return Ve().memoizedState;
}
function av(e, t, n) {
  var r = Mt(e);
  if (n = { lane: r, action: n, hasEagerState: !1, eagerState: null, next: null }, Md(e))
    Fd(t, n);
  else if (n = wd(e, t, n, r), n !== null) {
    var o = Se();
    Xe(n, e, r, o), $d(n, t, r);
  }
}
function uv(e, t, n) {
  var r = Mt(e), o = { lane: r, action: n, hasEagerState: !1, eagerState: null, next: null };
  if (Md(e))
    Fd(t, o);
  else {
    var l = e.alternate;
    if (e.lanes === 0 && (l === null || l.lanes === 0) && (l = t.lastRenderedReducer, l !== null))
      try {
        var i = t.lastRenderedState, s = l(i, n);
        if (o.hasEagerState = !0, o.eagerState = s, Ze(s, i)) {
          var a = t.interleaved;
          a === null ? (o.next = o, $s(t)) : (o.next = a.next, a.next = o), t.interleaved = o;
          return;
        }
      } catch {
      } finally {
      }
    n = wd(e, t, o, r), n !== null && (o = Se(), Xe(n, e, r, o), $d(n, t, r));
  }
}
function Md(e) {
  var t = e.alternate;
  return e === G || t !== null && t === G;
}
function Fd(e, t) {
  gr = Zo = !0;
  var n = e.pending;
  n === null ? t.next = t : (t.next = n.next, n.next = t), e.pending = t;
}
function $d(e, t, n) {
  if (n & 4194240) {
    var r = t.lanes;
    r &= e.pendingLanes, n |= r, t.lanes = n, Ns(e, n);
  }
}
var Jo = { readContext: We, useCallback: he, useContext: he, useEffect: he, useImperativeHandle: he, useInsertionEffect: he, useLayoutEffect: he, useMemo: he, useReducer: he, useRef: he, useState: he, useDebugValue: he, useDeferredValue: he, useTransition: he, useMutableSource: he, useSyncExternalStore: he, useId: he, unstable_isNewReconciler: !1 }, cv = { readContext: We, useCallback: function(e, t) {
  return nt().memoizedState = [e, t === void 0 ? null : t], e;
}, useContext: We, useEffect: du, useImperativeHandle: function(e, t, n) {
  return n = n != null ? n.concat([e]) : null, _o(
    4194308,
    4,
    Od.bind(null, t, e),
    n
  );
}, useLayoutEffect: function(e, t) {
  return _o(4194308, 4, e, t);
}, useInsertionEffect: function(e, t) {
  return _o(4, 2, e, t);
}, useMemo: function(e, t) {
  var n = nt();
  return t = t === void 0 ? null : t, e = e(), n.memoizedState = [e, t], e;
}, useReducer: function(e, t, n) {
  var r = nt();
  return t = n !== void 0 ? n(t) : t, r.memoizedState = r.baseState = t, e = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: e, lastRenderedState: t }, r.queue = e, e = e.dispatch = av.bind(null, G, e), [r.memoizedState, e];
}, useRef: function(e) {
  var t = nt();
  return e = { current: e }, t.memoizedState = e;
}, useState: cu, useDebugValue: Ks, useDeferredValue: function(e) {
  return nt().memoizedState = e;
}, useTransition: function() {
  var e = cu(!1), t = e[0];
  return e = sv.bind(null, e[1]), nt().memoizedState = e, [t, e];
}, useMutableSource: function() {
}, useSyncExternalStore: function(e, t, n) {
  var r = G, o = nt();
  if (H) {
    if (n === void 0)
      throw Error(_(407));
    n = n();
  } else {
    if (n = t(), ce === null)
      throw Error(_(349));
    rn & 30 || Ed(r, t, n);
  }
  o.memoizedState = n;
  var l = { value: n, getSnapshot: t };
  return o.queue = l, du(Nd.bind(
    null,
    r,
    l,
    e
  ), [e]), r.flags |= 2048, zr(9, Pd.bind(null, r, l, n, t), void 0, null), n;
}, useId: function() {
  var e = nt(), t = ce.identifierPrefix;
  if (H) {
    var n = ft, r = dt;
    n = (r & ~(1 << 32 - Ke(r) - 1)).toString(32) + n, t = ":" + t + "R" + n, n = Lr++, 0 < n && (t += "H" + n.toString(32)), t += ":";
  } else
    n = iv++, t = ":" + t + "r" + n.toString(32) + ":";
  return e.memoizedState = t;
}, unstable_isNewReconciler: !1 }, dv = {
  readContext: We,
  useCallback: Id,
  useContext: We,
  useEffect: Gs,
  useImperativeHandle: bd,
  useInsertionEffect: Ad,
  useLayoutEffect: jd,
  useMemo: Ld,
  useReducer: ti,
  useRef: Td,
  useState: function() {
    return ti(Dr);
  },
  useDebugValue: Ks,
  useDeferredValue: function(e) {
    var t = Ve();
    return Dd(t, ie.memoizedState, e);
  },
  useTransition: function() {
    var e = ti(Dr)[0], t = Ve().memoizedState;
    return [e, t];
  },
  useMutableSource: kd,
  useSyncExternalStore: Cd,
  useId: zd,
  unstable_isNewReconciler: !1
}, fv = { readContext: We, useCallback: Id, useContext: We, useEffect: Gs, useImperativeHandle: bd, useInsertionEffect: Ad, useLayoutEffect: jd, useMemo: Ld, useReducer: ni, useRef: Td, useState: function() {
  return ni(Dr);
}, useDebugValue: Ks, useDeferredValue: function(e) {
  var t = Ve();
  return ie === null ? t.memoizedState = e : Dd(t, ie.memoizedState, e);
}, useTransition: function() {
  var e = ni(Dr)[0], t = Ve().memoizedState;
  return [e, t];
}, useMutableSource: kd, useSyncExternalStore: Cd, useId: zd, unstable_isNewReconciler: !1 };
function Qe(e, t) {
  if (e && e.defaultProps) {
    t = K({}, t), e = e.defaultProps;
    for (var n in e)
      t[n] === void 0 && (t[n] = e[n]);
    return t;
  }
  return t;
}
function Yi(e, t, n, r) {
  t = e.memoizedState, n = n(r, t), n = n == null ? t : K({}, t, n), e.memoizedState = n, e.lanes === 0 && (e.updateQueue.baseState = n);
}
var yl = { isMounted: function(e) {
  return (e = e._reactInternals) ? un(e) === e : !1;
}, enqueueSetState: function(e, t, n) {
  e = e._reactInternals;
  var r = Se(), o = Mt(e), l = pt(r, o);
  l.payload = t, n != null && (l.callback = n), t = Dt(e, l, o), t !== null && (Xe(t, e, o, r), Po(t, e, o));
}, enqueueReplaceState: function(e, t, n) {
  e = e._reactInternals;
  var r = Se(), o = Mt(e), l = pt(r, o);
  l.tag = 1, l.payload = t, n != null && (l.callback = n), t = Dt(e, l, o), t !== null && (Xe(t, e, o, r), Po(t, e, o));
}, enqueueForceUpdate: function(e, t) {
  e = e._reactInternals;
  var n = Se(), r = Mt(e), o = pt(n, r);
  o.tag = 2, t != null && (o.callback = t), t = Dt(e, o, r), t !== null && (Xe(t, e, r, n), Po(t, e, r));
} };
function fu(e, t, n, r, o, l, i) {
  return e = e.stateNode, typeof e.shouldComponentUpdate == "function" ? e.shouldComponentUpdate(r, l, i) : t.prototype && t.prototype.isPureReactComponent ? !Tr(n, r) || !Tr(o, l) : !0;
}
function Wd(e, t, n) {
  var r = !1, o = Wt, l = t.contextType;
  return typeof l == "object" && l !== null ? l = We(l) : (o = _e(t) ? tn : ye.current, r = t.contextTypes, l = (r = r != null) ? Dn(e, o) : Wt), t = new t(n, l), e.memoizedState = t.state !== null && t.state !== void 0 ? t.state : null, t.updater = yl, e.stateNode = t, t._reactInternals = e, r && (e = e.stateNode, e.__reactInternalMemoizedUnmaskedChildContext = o, e.__reactInternalMemoizedMaskedChildContext = l), t;
}
function pu(e, t, n, r) {
  e = t.state, typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(n, r), typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(n, r), t.state !== e && yl.enqueueReplaceState(t, t.state, null);
}
function Gi(e, t, n, r) {
  var o = e.stateNode;
  o.props = n, o.state = e.memoizedState, o.refs = {}, Ws(e);
  var l = t.contextType;
  typeof l == "object" && l !== null ? o.context = We(l) : (l = _e(t) ? tn : ye.current, o.context = Dn(e, l)), o.state = e.memoizedState, l = t.getDerivedStateFromProps, typeof l == "function" && (Yi(e, t, l, n), o.state = e.memoizedState), typeof t.getDerivedStateFromProps == "function" || typeof o.getSnapshotBeforeUpdate == "function" || typeof o.UNSAFE_componentWillMount != "function" && typeof o.componentWillMount != "function" || (t = o.state, typeof o.componentWillMount == "function" && o.componentWillMount(), typeof o.UNSAFE_componentWillMount == "function" && o.UNSAFE_componentWillMount(), t !== o.state && yl.enqueueReplaceState(o, o.state, null), Ko(e, n, o, r), o.state = e.memoizedState), typeof o.componentDidMount == "function" && (e.flags |= 4194308);
}
function $n(e, t) {
  try {
    var n = "", r = t;
    do
      n += $m(r), r = r.return;
    while (r);
    var o = n;
  } catch (l) {
    o = `
Error generating stack: ` + l.message + `
` + l.stack;
  }
  return { value: e, source: t, stack: o, digest: null };
}
function ri(e, t, n) {
  return { value: e, source: null, stack: n ?? null, digest: t ?? null };
}
function Ki(e, t) {
  try {
    console.error(t.value);
  } catch (n) {
    setTimeout(function() {
      throw n;
    });
  }
}
var pv = typeof WeakMap == "function" ? WeakMap : Map;
function Vd(e, t, n) {
  n = pt(-1, n), n.tag = 3, n.payload = { element: null };
  var r = t.value;
  return n.callback = function() {
    el || (el = !0, ls = r), Ki(e, t);
  }, n;
}
function Ud(e, t, n) {
  n = pt(-1, n), n.tag = 3;
  var r = e.type.getDerivedStateFromError;
  if (typeof r == "function") {
    var o = t.value;
    n.payload = function() {
      return r(o);
    }, n.callback = function() {
      Ki(e, t);
    };
  }
  var l = e.stateNode;
  return l !== null && typeof l.componentDidCatch == "function" && (n.callback = function() {
    Ki(e, t), typeof r != "function" && (zt === null ? zt = /* @__PURE__ */ new Set([this]) : zt.add(this));
    var i = t.stack;
    this.componentDidCatch(t.value, { componentStack: i !== null ? i : "" });
  }), n;
}
function mu(e, t, n) {
  var r = e.pingCache;
  if (r === null) {
    r = e.pingCache = new pv();
    var o = /* @__PURE__ */ new Set();
    r.set(t, o);
  } else
    o = r.get(t), o === void 0 && (o = /* @__PURE__ */ new Set(), r.set(t, o));
  o.has(n) || (o.add(n), e = _v.bind(null, e, t, n), t.then(e, e));
}
function hu(e) {
  do {
    var t;
    if ((t = e.tag === 13) && (t = e.memoizedState, t = t !== null ? t.dehydrated !== null : !0), t)
      return e;
    e = e.return;
  } while (e !== null);
  return null;
}
function vu(e, t, n, r, o) {
  return e.mode & 1 ? (e.flags |= 65536, e.lanes = o, e) : (e === t ? e.flags |= 65536 : (e.flags |= 128, n.flags |= 131072, n.flags &= -52805, n.tag === 1 && (n.alternate === null ? n.tag = 17 : (t = pt(-1, 1), t.tag = 2, Dt(n, t, 1))), n.lanes |= 1), e);
}
var mv = yt.ReactCurrentOwner, Pe = !1;
function we(e, t, n, r) {
  t.child = e === null ? yd(t, null, n, r) : Mn(t, e.child, n, r);
}
function gu(e, t, n, r, o) {
  n = n.render;
  var l = t.ref;
  return On(t, o), r = Qs(e, t, n, r, l, o), n = Ys(), e !== null && !Pe ? (t.updateQueue = e.updateQueue, t.flags &= -2053, e.lanes &= ~o, gt(e, t, o)) : (H && n && Is(t), t.flags |= 1, we(e, t, r, o), t.child);
}
function yu(e, t, n, r, o) {
  if (e === null) {
    var l = n.type;
    return typeof l == "function" && !ra(l) && l.defaultProps === void 0 && n.compare === null && n.defaultProps === void 0 ? (t.tag = 15, t.type = l, Bd(e, t, l, r, o)) : (e = jo(n.type, null, r, t, t.mode, o), e.ref = t.ref, e.return = t, t.child = e);
  }
  if (l = e.child, !(e.lanes & o)) {
    var i = l.memoizedProps;
    if (n = n.compare, n = n !== null ? n : Tr, n(i, r) && e.ref === t.ref)
      return gt(e, t, o);
  }
  return t.flags |= 1, e = Ft(l, r), e.ref = t.ref, e.return = t, t.child = e;
}
function Bd(e, t, n, r, o) {
  if (e !== null) {
    var l = e.memoizedProps;
    if (Tr(l, r) && e.ref === t.ref)
      if (Pe = !1, t.pendingProps = r = l, (e.lanes & o) !== 0)
        e.flags & 131072 && (Pe = !0);
      else
        return t.lanes = e.lanes, gt(e, t, o);
  }
  return Xi(e, t, n, r, o);
}
function Hd(e, t, n) {
  var r = t.pendingProps, o = r.children, l = e !== null ? e.memoizedState : null;
  if (r.mode === "hidden")
    if (!(t.mode & 1))
      t.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }, W(_n, Ae), Ae |= n;
    else {
      if (!(n & 1073741824))
        return e = l !== null ? l.baseLanes | n : n, t.lanes = t.childLanes = 1073741824, t.memoizedState = { baseLanes: e, cachePool: null, transitions: null }, t.updateQueue = null, W(_n, Ae), Ae |= e, null;
      t.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }, r = l !== null ? l.baseLanes : n, W(_n, Ae), Ae |= r;
    }
  else
    l !== null ? (r = l.baseLanes | n, t.memoizedState = null) : r = n, W(_n, Ae), Ae |= r;
  return we(e, t, o, n), t.child;
}
function Qd(e, t) {
  var n = t.ref;
  (e === null && n !== null || e !== null && e.ref !== n) && (t.flags |= 512, t.flags |= 2097152);
}
function Xi(e, t, n, r, o) {
  var l = _e(n) ? tn : ye.current;
  return l = Dn(t, l), On(t, o), n = Qs(e, t, n, r, l, o), r = Ys(), e !== null && !Pe ? (t.updateQueue = e.updateQueue, t.flags &= -2053, e.lanes &= ~o, gt(e, t, o)) : (H && r && Is(t), t.flags |= 1, we(e, t, n, o), t.child);
}
function wu(e, t, n, r, o) {
  if (_e(n)) {
    var l = !0;
    Bo(t);
  } else
    l = !1;
  if (On(t, o), t.stateNode === null)
    Ro(e, t), Wd(t, n, r), Gi(t, n, r, o), r = !0;
  else if (e === null) {
    var i = t.stateNode, s = t.memoizedProps;
    i.props = s;
    var a = i.context, u = n.contextType;
    typeof u == "object" && u !== null ? u = We(u) : (u = _e(n) ? tn : ye.current, u = Dn(t, u));
    var f = n.getDerivedStateFromProps, m = typeof f == "function" || typeof i.getSnapshotBeforeUpdate == "function";
    m || typeof i.UNSAFE_componentWillReceiveProps != "function" && typeof i.componentWillReceiveProps != "function" || (s !== r || a !== u) && pu(t, i, r, u), _t = !1;
    var p = t.memoizedState;
    i.state = p, Ko(t, r, i, o), a = t.memoizedState, s !== r || p !== a || Ne.current || _t ? (typeof f == "function" && (Yi(t, n, f, r), a = t.memoizedState), (s = _t || fu(t, n, s, r, p, a, u)) ? (m || typeof i.UNSAFE_componentWillMount != "function" && typeof i.componentWillMount != "function" || (typeof i.componentWillMount == "function" && i.componentWillMount(), typeof i.UNSAFE_componentWillMount == "function" && i.UNSAFE_componentWillMount()), typeof i.componentDidMount == "function" && (t.flags |= 4194308)) : (typeof i.componentDidMount == "function" && (t.flags |= 4194308), t.memoizedProps = r, t.memoizedState = a), i.props = r, i.state = a, i.context = u, r = s) : (typeof i.componentDidMount == "function" && (t.flags |= 4194308), r = !1);
  } else {
    i = t.stateNode, Sd(e, t), s = t.memoizedProps, u = t.type === t.elementType ? s : Qe(t.type, s), i.props = u, m = t.pendingProps, p = i.context, a = n.contextType, typeof a == "object" && a !== null ? a = We(a) : (a = _e(n) ? tn : ye.current, a = Dn(t, a));
    var w = n.getDerivedStateFromProps;
    (f = typeof w == "function" || typeof i.getSnapshotBeforeUpdate == "function") || typeof i.UNSAFE_componentWillReceiveProps != "function" && typeof i.componentWillReceiveProps != "function" || (s !== m || p !== a) && pu(t, i, r, a), _t = !1, p = t.memoizedState, i.state = p, Ko(t, r, i, o);
    var x = t.memoizedState;
    s !== m || p !== x || Ne.current || _t ? (typeof w == "function" && (Yi(t, n, w, r), x = t.memoizedState), (u = _t || fu(t, n, u, r, p, x, a) || !1) ? (f || typeof i.UNSAFE_componentWillUpdate != "function" && typeof i.componentWillUpdate != "function" || (typeof i.componentWillUpdate == "function" && i.componentWillUpdate(r, x, a), typeof i.UNSAFE_componentWillUpdate == "function" && i.UNSAFE_componentWillUpdate(r, x, a)), typeof i.componentDidUpdate == "function" && (t.flags |= 4), typeof i.getSnapshotBeforeUpdate == "function" && (t.flags |= 1024)) : (typeof i.componentDidUpdate != "function" || s === e.memoizedProps && p === e.memoizedState || (t.flags |= 4), typeof i.getSnapshotBeforeUpdate != "function" || s === e.memoizedProps && p === e.memoizedState || (t.flags |= 1024), t.memoizedProps = r, t.memoizedState = x), i.props = r, i.state = x, i.context = a, r = u) : (typeof i.componentDidUpdate != "function" || s === e.memoizedProps && p === e.memoizedState || (t.flags |= 4), typeof i.getSnapshotBeforeUpdate != "function" || s === e.memoizedProps && p === e.memoizedState || (t.flags |= 1024), r = !1);
  }
  return Zi(e, t, n, r, l, o);
}
function Zi(e, t, n, r, o, l) {
  Qd(e, t);
  var i = (t.flags & 128) !== 0;
  if (!r && !i)
    return o && ou(t, n, !1), gt(e, t, l);
  r = t.stateNode, mv.current = t;
  var s = i && typeof n.getDerivedStateFromError != "function" ? null : r.render();
  return t.flags |= 1, e !== null && i ? (t.child = Mn(t, e.child, null, l), t.child = Mn(t, null, s, l)) : we(e, t, s, l), t.memoizedState = r.state, o && ou(t, n, !0), t.child;
}
function Yd(e) {
  var t = e.stateNode;
  t.pendingContext ? ru(e, t.pendingContext, t.pendingContext !== t.context) : t.context && ru(e, t.context, !1), Vs(e, t.containerInfo);
}
function Su(e, t, n, r, o) {
  return zn(), Ds(o), t.flags |= 256, we(e, t, n, r), t.child;
}
var Ji = { dehydrated: null, treeContext: null, retryLane: 0 };
function qi(e) {
  return { baseLanes: e, cachePool: null, transitions: null };
}
function Gd(e, t, n) {
  var r = t.pendingProps, o = Y.current, l = !1, i = (t.flags & 128) !== 0, s;
  if ((s = i) || (s = e !== null && e.memoizedState === null ? !1 : (o & 2) !== 0), s ? (l = !0, t.flags &= -129) : (e === null || e.memoizedState !== null) && (o |= 1), W(Y, o & 1), e === null)
    return Hi(t), e = t.memoizedState, e !== null && (e = e.dehydrated, e !== null) ? (t.mode & 1 ? e.data === "$!" ? t.lanes = 8 : t.lanes = 1073741824 : t.lanes = 1, null) : (i = r.children, e = r.fallback, l ? (r = t.mode, l = t.child, i = { mode: "hidden", children: i }, !(r & 1) && l !== null ? (l.childLanes = 0, l.pendingProps = i) : l = xl(i, r, 0, null), e = qt(e, r, n, null), l.return = t, e.return = t, l.sibling = e, t.child = l, t.child.memoizedState = qi(n), t.memoizedState = Ji, e) : Xs(t, i));
  if (o = e.memoizedState, o !== null && (s = o.dehydrated, s !== null))
    return hv(e, t, i, r, s, o, n);
  if (l) {
    l = r.fallback, i = t.mode, o = e.child, s = o.sibling;
    var a = { mode: "hidden", children: r.children };
    return !(i & 1) && t.child !== o ? (r = t.child, r.childLanes = 0, r.pendingProps = a, t.deletions = null) : (r = Ft(o, a), r.subtreeFlags = o.subtreeFlags & 14680064), s !== null ? l = Ft(s, l) : (l = qt(l, i, n, null), l.flags |= 2), l.return = t, r.return = t, r.sibling = l, t.child = r, r = l, l = t.child, i = e.child.memoizedState, i = i === null ? qi(n) : { baseLanes: i.baseLanes | n, cachePool: null, transitions: i.transitions }, l.memoizedState = i, l.childLanes = e.childLanes & ~n, t.memoizedState = Ji, r;
  }
  return l = e.child, e = l.sibling, r = Ft(l, { mode: "visible", children: r.children }), !(t.mode & 1) && (r.lanes = n), r.return = t, r.sibling = null, e !== null && (n = t.deletions, n === null ? (t.deletions = [e], t.flags |= 16) : n.push(e)), t.child = r, t.memoizedState = null, r;
}
function Xs(e, t) {
  return t = xl({ mode: "visible", children: t }, e.mode, 0, null), t.return = e, e.child = t;
}
function ao(e, t, n, r) {
  return r !== null && Ds(r), Mn(t, e.child, null, n), e = Xs(t, t.pendingProps.children), e.flags |= 2, t.memoizedState = null, e;
}
function hv(e, t, n, r, o, l, i) {
  if (n)
    return t.flags & 256 ? (t.flags &= -257, r = ri(Error(_(422))), ao(e, t, i, r)) : t.memoizedState !== null ? (t.child = e.child, t.flags |= 128, null) : (l = r.fallback, o = t.mode, r = xl({ mode: "visible", children: r.children }, o, 0, null), l = qt(l, o, i, null), l.flags |= 2, r.return = t, l.return = t, r.sibling = l, t.child = r, t.mode & 1 && Mn(t, e.child, null, i), t.child.memoizedState = qi(i), t.memoizedState = Ji, l);
  if (!(t.mode & 1))
    return ao(e, t, i, null);
  if (o.data === "$!") {
    if (r = o.nextSibling && o.nextSibling.dataset, r)
      var s = r.dgst;
    return r = s, l = Error(_(419)), r = ri(l, r, void 0), ao(e, t, i, r);
  }
  if (s = (i & e.childLanes) !== 0, Pe || s) {
    if (r = ce, r !== null) {
      switch (i & -i) {
        case 4:
          o = 2;
          break;
        case 16:
          o = 8;
          break;
        case 64:
        case 128:
        case 256:
        case 512:
        case 1024:
        case 2048:
        case 4096:
        case 8192:
        case 16384:
        case 32768:
        case 65536:
        case 131072:
        case 262144:
        case 524288:
        case 1048576:
        case 2097152:
        case 4194304:
        case 8388608:
        case 16777216:
        case 33554432:
        case 67108864:
          o = 32;
          break;
        case 536870912:
          o = 268435456;
          break;
        default:
          o = 0;
      }
      o = o & (r.suspendedLanes | i) ? 0 : o, o !== 0 && o !== l.retryLane && (l.retryLane = o, vt(e, o), Xe(r, e, o, -1));
    }
    return na(), r = ri(Error(_(421))), ao(e, t, i, r);
  }
  return o.data === "$?" ? (t.flags |= 128, t.child = e.child, t = Rv.bind(null, e), o._reactRetry = t, null) : (e = l.treeContext, je = Lt(o.nextSibling), Oe = t, H = !0, Ge = null, e !== null && (De[ze++] = dt, De[ze++] = ft, De[ze++] = nn, dt = e.id, ft = e.overflow, nn = t), t = Xs(t, r.children), t.flags |= 4096, t);
}
function xu(e, t, n) {
  e.lanes |= t;
  var r = e.alternate;
  r !== null && (r.lanes |= t), Qi(e.return, t, n);
}
function oi(e, t, n, r, o) {
  var l = e.memoizedState;
  l === null ? e.memoizedState = { isBackwards: t, rendering: null, renderingStartTime: 0, last: r, tail: n, tailMode: o } : (l.isBackwards = t, l.rendering = null, l.renderingStartTime = 0, l.last = r, l.tail = n, l.tailMode = o);
}
function Kd(e, t, n) {
  var r = t.pendingProps, o = r.revealOrder, l = r.tail;
  if (we(e, t, r.children, n), r = Y.current, r & 2)
    r = r & 1 | 2, t.flags |= 128;
  else {
    if (e !== null && e.flags & 128)
      e:
        for (e = t.child; e !== null; ) {
          if (e.tag === 13)
            e.memoizedState !== null && xu(e, n, t);
          else if (e.tag === 19)
            xu(e, n, t);
          else if (e.child !== null) {
            e.child.return = e, e = e.child;
            continue;
          }
          if (e === t)
            break e;
          for (; e.sibling === null; ) {
            if (e.return === null || e.return === t)
              break e;
            e = e.return;
          }
          e.sibling.return = e.return, e = e.sibling;
        }
    r &= 1;
  }
  if (W(Y, r), !(t.mode & 1))
    t.memoizedState = null;
  else
    switch (o) {
      case "forwards":
        for (n = t.child, o = null; n !== null; )
          e = n.alternate, e !== null && Xo(e) === null && (o = n), n = n.sibling;
        n = o, n === null ? (o = t.child, t.child = null) : (o = n.sibling, n.sibling = null), oi(t, !1, o, n, l);
        break;
      case "backwards":
        for (n = null, o = t.child, t.child = null; o !== null; ) {
          if (e = o.alternate, e !== null && Xo(e) === null) {
            t.child = o;
            break;
          }
          e = o.sibling, o.sibling = n, n = o, o = e;
        }
        oi(t, !0, n, null, l);
        break;
      case "together":
        oi(t, !1, null, null, void 0);
        break;
      default:
        t.memoizedState = null;
    }
  return t.child;
}
function Ro(e, t) {
  !(t.mode & 1) && e !== null && (e.alternate = null, t.alternate = null, t.flags |= 2);
}
function gt(e, t, n) {
  if (e !== null && (t.dependencies = e.dependencies), on |= t.lanes, !(n & t.childLanes))
    return null;
  if (e !== null && t.child !== e.child)
    throw Error(_(153));
  if (t.child !== null) {
    for (e = t.child, n = Ft(e, e.pendingProps), t.child = n, n.return = t; e.sibling !== null; )
      e = e.sibling, n = n.sibling = Ft(e, e.pendingProps), n.return = t;
    n.sibling = null;
  }
  return t.child;
}
function vv(e, t, n) {
  switch (t.tag) {
    case 3:
      Yd(t), zn();
      break;
    case 5:
      xd(t);
      break;
    case 1:
      _e(t.type) && Bo(t);
      break;
    case 4:
      Vs(t, t.stateNode.containerInfo);
      break;
    case 10:
      var r = t.type._context, o = t.memoizedProps.value;
      W(Yo, r._currentValue), r._currentValue = o;
      break;
    case 13:
      if (r = t.memoizedState, r !== null)
        return r.dehydrated !== null ? (W(Y, Y.current & 1), t.flags |= 128, null) : n & t.child.childLanes ? Gd(e, t, n) : (W(Y, Y.current & 1), e = gt(e, t, n), e !== null ? e.sibling : null);
      W(Y, Y.current & 1);
      break;
    case 19:
      if (r = (n & t.childLanes) !== 0, e.flags & 128) {
        if (r)
          return Kd(e, t, n);
        t.flags |= 128;
      }
      if (o = t.memoizedState, o !== null && (o.rendering = null, o.tail = null, o.lastEffect = null), W(Y, Y.current), r)
        break;
      return null;
    case 22:
    case 23:
      return t.lanes = 0, Hd(e, t, n);
  }
  return gt(e, t, n);
}
var Xd, es, Zd, Jd;
Xd = function(e, t) {
  for (var n = t.child; n !== null; ) {
    if (n.tag === 5 || n.tag === 6)
      e.appendChild(n.stateNode);
    else if (n.tag !== 4 && n.child !== null) {
      n.child.return = n, n = n.child;
      continue;
    }
    if (n === t)
      break;
    for (; n.sibling === null; ) {
      if (n.return === null || n.return === t)
        return;
      n = n.return;
    }
    n.sibling.return = n.return, n = n.sibling;
  }
};
es = function() {
};
Zd = function(e, t, n, r) {
  var o = e.memoizedProps;
  if (o !== r) {
    e = t.stateNode, Zt(it.current);
    var l = null;
    switch (n) {
      case "input":
        o = ki(e, o), r = ki(e, r), l = [];
        break;
      case "select":
        o = K({}, o, { value: void 0 }), r = K({}, r, { value: void 0 }), l = [];
        break;
      case "textarea":
        o = Pi(e, o), r = Pi(e, r), l = [];
        break;
      default:
        typeof o.onClick != "function" && typeof r.onClick == "function" && (e.onclick = Vo);
    }
    _i(n, r);
    var i;
    n = null;
    for (u in o)
      if (!r.hasOwnProperty(u) && o.hasOwnProperty(u) && o[u] != null)
        if (u === "style") {
          var s = o[u];
          for (i in s)
            s.hasOwnProperty(i) && (n || (n = {}), n[i] = "");
        } else
          u !== "dangerouslySetInnerHTML" && u !== "children" && u !== "suppressContentEditableWarning" && u !== "suppressHydrationWarning" && u !== "autoFocus" && (kr.hasOwnProperty(u) ? l || (l = []) : (l = l || []).push(u, null));
    for (u in r) {
      var a = r[u];
      if (s = o != null ? o[u] : void 0, r.hasOwnProperty(u) && a !== s && (a != null || s != null))
        if (u === "style")
          if (s) {
            for (i in s)
              !s.hasOwnProperty(i) || a && a.hasOwnProperty(i) || (n || (n = {}), n[i] = "");
            for (i in a)
              a.hasOwnProperty(i) && s[i] !== a[i] && (n || (n = {}), n[i] = a[i]);
          } else
            n || (l || (l = []), l.push(
              u,
              n
            )), n = a;
        else
          u === "dangerouslySetInnerHTML" ? (a = a ? a.__html : void 0, s = s ? s.__html : void 0, a != null && s !== a && (l = l || []).push(u, a)) : u === "children" ? typeof a != "string" && typeof a != "number" || (l = l || []).push(u, "" + a) : u !== "suppressContentEditableWarning" && u !== "suppressHydrationWarning" && (kr.hasOwnProperty(u) ? (a != null && u === "onScroll" && V("scroll", e), l || s === a || (l = [])) : (l = l || []).push(u, a));
    }
    n && (l = l || []).push("style", n);
    var u = l;
    (t.updateQueue = u) && (t.flags |= 4);
  }
};
Jd = function(e, t, n, r) {
  n !== r && (t.flags |= 4);
};
function tr(e, t) {
  if (!H)
    switch (e.tailMode) {
      case "hidden":
        t = e.tail;
        for (var n = null; t !== null; )
          t.alternate !== null && (n = t), t = t.sibling;
        n === null ? e.tail = null : n.sibling = null;
        break;
      case "collapsed":
        n = e.tail;
        for (var r = null; n !== null; )
          n.alternate !== null && (r = n), n = n.sibling;
        r === null ? t || e.tail === null ? e.tail = null : e.tail.sibling = null : r.sibling = null;
    }
}
function ve(e) {
  var t = e.alternate !== null && e.alternate.child === e.child, n = 0, r = 0;
  if (t)
    for (var o = e.child; o !== null; )
      n |= o.lanes | o.childLanes, r |= o.subtreeFlags & 14680064, r |= o.flags & 14680064, o.return = e, o = o.sibling;
  else
    for (o = e.child; o !== null; )
      n |= o.lanes | o.childLanes, r |= o.subtreeFlags, r |= o.flags, o.return = e, o = o.sibling;
  return e.subtreeFlags |= r, e.childLanes = n, t;
}
function gv(e, t, n) {
  var r = t.pendingProps;
  switch (Ls(t), t.tag) {
    case 2:
    case 16:
    case 15:
    case 0:
    case 11:
    case 7:
    case 8:
    case 12:
    case 9:
    case 14:
      return ve(t), null;
    case 1:
      return _e(t.type) && Uo(), ve(t), null;
    case 3:
      return r = t.stateNode, Fn(), U(Ne), U(ye), Bs(), r.pendingContext && (r.context = r.pendingContext, r.pendingContext = null), (e === null || e.child === null) && (io(t) ? t.flags |= 4 : e === null || e.memoizedState.isDehydrated && !(t.flags & 256) || (t.flags |= 1024, Ge !== null && (as(Ge), Ge = null))), es(e, t), ve(t), null;
    case 5:
      Us(t);
      var o = Zt(Ir.current);
      if (n = t.type, e !== null && t.stateNode != null)
        Zd(e, t, n, r, o), e.ref !== t.ref && (t.flags |= 512, t.flags |= 2097152);
      else {
        if (!r) {
          if (t.stateNode === null)
            throw Error(_(166));
          return ve(t), null;
        }
        if (e = Zt(it.current), io(t)) {
          r = t.stateNode, n = t.type;
          var l = t.memoizedProps;
          switch (r[rt] = t, r[Or] = l, e = (t.mode & 1) !== 0, n) {
            case "dialog":
              V("cancel", r), V("close", r);
              break;
            case "iframe":
            case "object":
            case "embed":
              V("load", r);
              break;
            case "video":
            case "audio":
              for (o = 0; o < sr.length; o++)
                V(sr[o], r);
              break;
            case "source":
              V("error", r);
              break;
            case "img":
            case "image":
            case "link":
              V(
                "error",
                r
              ), V("load", r);
              break;
            case "details":
              V("toggle", r);
              break;
            case "input":
              Aa(r, l), V("invalid", r);
              break;
            case "select":
              r._wrapperState = { wasMultiple: !!l.multiple }, V("invalid", r);
              break;
            case "textarea":
              Oa(r, l), V("invalid", r);
          }
          _i(n, l), o = null;
          for (var i in l)
            if (l.hasOwnProperty(i)) {
              var s = l[i];
              i === "children" ? typeof s == "string" ? r.textContent !== s && (l.suppressHydrationWarning !== !0 && lo(r.textContent, s, e), o = ["children", s]) : typeof s == "number" && r.textContent !== "" + s && (l.suppressHydrationWarning !== !0 && lo(
                r.textContent,
                s,
                e
              ), o = ["children", "" + s]) : kr.hasOwnProperty(i) && s != null && i === "onScroll" && V("scroll", r);
            }
          switch (n) {
            case "input":
              Zr(r), ja(r, l, !0);
              break;
            case "textarea":
              Zr(r), ba(r);
              break;
            case "select":
            case "option":
              break;
            default:
              typeof l.onClick == "function" && (r.onclick = Vo);
          }
          r = o, t.updateQueue = r, r !== null && (t.flags |= 4);
        } else {
          i = o.nodeType === 9 ? o : o.ownerDocument, e === "http://www.w3.org/1999/xhtml" && (e = Nc(n)), e === "http://www.w3.org/1999/xhtml" ? n === "script" ? (e = i.createElement("div"), e.innerHTML = "<script><\/script>", e = e.removeChild(e.firstChild)) : typeof r.is == "string" ? e = i.createElement(n, { is: r.is }) : (e = i.createElement(n), n === "select" && (i = e, r.multiple ? i.multiple = !0 : r.size && (i.size = r.size))) : e = i.createElementNS(e, n), e[rt] = t, e[Or] = r, Xd(e, t, !1, !1), t.stateNode = e;
          e: {
            switch (i = Ri(n, r), n) {
              case "dialog":
                V("cancel", e), V("close", e), o = r;
                break;
              case "iframe":
              case "object":
              case "embed":
                V("load", e), o = r;
                break;
              case "video":
              case "audio":
                for (o = 0; o < sr.length; o++)
                  V(sr[o], e);
                o = r;
                break;
              case "source":
                V("error", e), o = r;
                break;
              case "img":
              case "image":
              case "link":
                V(
                  "error",
                  e
                ), V("load", e), o = r;
                break;
              case "details":
                V("toggle", e), o = r;
                break;
              case "input":
                Aa(e, r), o = ki(e, r), V("invalid", e);
                break;
              case "option":
                o = r;
                break;
              case "select":
                e._wrapperState = { wasMultiple: !!r.multiple }, o = K({}, r, { value: void 0 }), V("invalid", e);
                break;
              case "textarea":
                Oa(e, r), o = Pi(e, r), V("invalid", e);
                break;
              default:
                o = r;
            }
            _i(n, o), s = o;
            for (l in s)
              if (s.hasOwnProperty(l)) {
                var a = s[l];
                l === "style" ? Tc(e, a) : l === "dangerouslySetInnerHTML" ? (a = a ? a.__html : void 0, a != null && _c(e, a)) : l === "children" ? typeof a == "string" ? (n !== "textarea" || a !== "") && Cr(e, a) : typeof a == "number" && Cr(e, "" + a) : l !== "suppressContentEditableWarning" && l !== "suppressHydrationWarning" && l !== "autoFocus" && (kr.hasOwnProperty(l) ? a != null && l === "onScroll" && V("scroll", e) : a != null && Ss(e, l, a, i));
              }
            switch (n) {
              case "input":
                Zr(e), ja(e, r, !1);
                break;
              case "textarea":
                Zr(e), ba(e);
                break;
              case "option":
                r.value != null && e.setAttribute("value", "" + $t(r.value));
                break;
              case "select":
                e.multiple = !!r.multiple, l = r.value, l != null ? Rn(e, !!r.multiple, l, !1) : r.defaultValue != null && Rn(
                  e,
                  !!r.multiple,
                  r.defaultValue,
                  !0
                );
                break;
              default:
                typeof o.onClick == "function" && (e.onclick = Vo);
            }
            switch (n) {
              case "button":
              case "input":
              case "select":
              case "textarea":
                r = !!r.autoFocus;
                break e;
              case "img":
                r = !0;
                break e;
              default:
                r = !1;
            }
          }
          r && (t.flags |= 4);
        }
        t.ref !== null && (t.flags |= 512, t.flags |= 2097152);
      }
      return ve(t), null;
    case 6:
      if (e && t.stateNode != null)
        Jd(e, t, e.memoizedProps, r);
      else {
        if (typeof r != "string" && t.stateNode === null)
          throw Error(_(166));
        if (n = Zt(Ir.current), Zt(it.current), io(t)) {
          if (r = t.stateNode, n = t.memoizedProps, r[rt] = t, (l = r.nodeValue !== n) && (e = Oe, e !== null))
            switch (e.tag) {
              case 3:
                lo(r.nodeValue, n, (e.mode & 1) !== 0);
                break;
              case 5:
                e.memoizedProps.suppressHydrationWarning !== !0 && lo(r.nodeValue, n, (e.mode & 1) !== 0);
            }
          l && (t.flags |= 4);
        } else
          r = (n.nodeType === 9 ? n : n.ownerDocument).createTextNode(r), r[rt] = t, t.stateNode = r;
      }
      return ve(t), null;
    case 13:
      if (U(Y), r = t.memoizedState, e === null || e.memoizedState !== null && e.memoizedState.dehydrated !== null) {
        if (H && je !== null && t.mode & 1 && !(t.flags & 128))
          vd(), zn(), t.flags |= 98560, l = !1;
        else if (l = io(t), r !== null && r.dehydrated !== null) {
          if (e === null) {
            if (!l)
              throw Error(_(318));
            if (l = t.memoizedState, l = l !== null ? l.dehydrated : null, !l)
              throw Error(_(317));
            l[rt] = t;
          } else
            zn(), !(t.flags & 128) && (t.memoizedState = null), t.flags |= 4;
          ve(t), l = !1;
        } else
          Ge !== null && (as(Ge), Ge = null), l = !0;
        if (!l)
          return t.flags & 65536 ? t : null;
      }
      return t.flags & 128 ? (t.lanes = n, t) : (r = r !== null, r !== (e !== null && e.memoizedState !== null) && r && (t.child.flags |= 8192, t.mode & 1 && (e === null || Y.current & 1 ? se === 0 && (se = 3) : na())), t.updateQueue !== null && (t.flags |= 4), ve(t), null);
    case 4:
      return Fn(), es(e, t), e === null && Ar(t.stateNode.containerInfo), ve(t), null;
    case 10:
      return Fs(t.type._context), ve(t), null;
    case 17:
      return _e(t.type) && Uo(), ve(t), null;
    case 19:
      if (U(Y), l = t.memoizedState, l === null)
        return ve(t), null;
      if (r = (t.flags & 128) !== 0, i = l.rendering, i === null)
        if (r)
          tr(l, !1);
        else {
          if (se !== 0 || e !== null && e.flags & 128)
            for (e = t.child; e !== null; ) {
              if (i = Xo(e), i !== null) {
                for (t.flags |= 128, tr(l, !1), r = i.updateQueue, r !== null && (t.updateQueue = r, t.flags |= 4), t.subtreeFlags = 0, r = n, n = t.child; n !== null; )
                  l = n, e = r, l.flags &= 14680066, i = l.alternate, i === null ? (l.childLanes = 0, l.lanes = e, l.child = null, l.subtreeFlags = 0, l.memoizedProps = null, l.memoizedState = null, l.updateQueue = null, l.dependencies = null, l.stateNode = null) : (l.childLanes = i.childLanes, l.lanes = i.lanes, l.child = i.child, l.subtreeFlags = 0, l.deletions = null, l.memoizedProps = i.memoizedProps, l.memoizedState = i.memoizedState, l.updateQueue = i.updateQueue, l.type = i.type, e = i.dependencies, l.dependencies = e === null ? null : { lanes: e.lanes, firstContext: e.firstContext }), n = n.sibling;
                return W(Y, Y.current & 1 | 2), t.child;
              }
              e = e.sibling;
            }
          l.tail !== null && ee() > Wn && (t.flags |= 128, r = !0, tr(l, !1), t.lanes = 4194304);
        }
      else {
        if (!r)
          if (e = Xo(i), e !== null) {
            if (t.flags |= 128, r = !0, n = e.updateQueue, n !== null && (t.updateQueue = n, t.flags |= 4), tr(l, !0), l.tail === null && l.tailMode === "hidden" && !i.alternate && !H)
              return ve(t), null;
          } else
            2 * ee() - l.renderingStartTime > Wn && n !== 1073741824 && (t.flags |= 128, r = !0, tr(l, !1), t.lanes = 4194304);
        l.isBackwards ? (i.sibling = t.child, t.child = i) : (n = l.last, n !== null ? n.sibling = i : t.child = i, l.last = i);
      }
      return l.tail !== null ? (t = l.tail, l.rendering = t, l.tail = t.sibling, l.renderingStartTime = ee(), t.sibling = null, n = Y.current, W(Y, r ? n & 1 | 2 : n & 1), t) : (ve(t), null);
    case 22:
    case 23:
      return ta(), r = t.memoizedState !== null, e !== null && e.memoizedState !== null !== r && (t.flags |= 8192), r && t.mode & 1 ? Ae & 1073741824 && (ve(t), t.subtreeFlags & 6 && (t.flags |= 8192)) : ve(t), null;
    case 24:
      return null;
    case 25:
      return null;
  }
  throw Error(_(156, t.tag));
}
function yv(e, t) {
  switch (Ls(t), t.tag) {
    case 1:
      return _e(t.type) && Uo(), e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
    case 3:
      return Fn(), U(Ne), U(ye), Bs(), e = t.flags, e & 65536 && !(e & 128) ? (t.flags = e & -65537 | 128, t) : null;
    case 5:
      return Us(t), null;
    case 13:
      if (U(Y), e = t.memoizedState, e !== null && e.dehydrated !== null) {
        if (t.alternate === null)
          throw Error(_(340));
        zn();
      }
      return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
    case 19:
      return U(Y), null;
    case 4:
      return Fn(), null;
    case 10:
      return Fs(t.type._context), null;
    case 22:
    case 23:
      return ta(), null;
    case 24:
      return null;
    default:
      return null;
  }
}
var uo = !1, ge = !1, wv = typeof WeakSet == "function" ? WeakSet : Set, T = null;
function Nn(e, t) {
  var n = e.ref;
  if (n !== null)
    if (typeof n == "function")
      try {
        n(null);
      } catch (r) {
        Z(e, t, r);
      }
    else
      n.current = null;
}
function ts(e, t, n) {
  try {
    n();
  } catch (r) {
    Z(e, t, r);
  }
}
var ku = !1;
function Sv(e, t) {
  if (Mi = Fo, e = rd(), bs(e)) {
    if ("selectionStart" in e)
      var n = { start: e.selectionStart, end: e.selectionEnd };
    else
      e: {
        n = (n = e.ownerDocument) && n.defaultView || window;
        var r = n.getSelection && n.getSelection();
        if (r && r.rangeCount !== 0) {
          n = r.anchorNode;
          var o = r.anchorOffset, l = r.focusNode;
          r = r.focusOffset;
          try {
            n.nodeType, l.nodeType;
          } catch {
            n = null;
            break e;
          }
          var i = 0, s = -1, a = -1, u = 0, f = 0, m = e, p = null;
          t:
            for (; ; ) {
              for (var w; m !== n || o !== 0 && m.nodeType !== 3 || (s = i + o), m !== l || r !== 0 && m.nodeType !== 3 || (a = i + r), m.nodeType === 3 && (i += m.nodeValue.length), (w = m.firstChild) !== null; )
                p = m, m = w;
              for (; ; ) {
                if (m === e)
                  break t;
                if (p === n && ++u === o && (s = i), p === l && ++f === r && (a = i), (w = m.nextSibling) !== null)
                  break;
                m = p, p = m.parentNode;
              }
              m = w;
            }
          n = s === -1 || a === -1 ? null : { start: s, end: a };
        } else
          n = null;
      }
    n = n || { start: 0, end: 0 };
  } else
    n = null;
  for (Fi = { focusedElem: e, selectionRange: n }, Fo = !1, T = t; T !== null; )
    if (t = T, e = t.child, (t.subtreeFlags & 1028) !== 0 && e !== null)
      e.return = t, T = e;
    else
      for (; T !== null; ) {
        t = T;
        try {
          var x = t.alternate;
          if (t.flags & 1024)
            switch (t.tag) {
              case 0:
              case 11:
              case 15:
                break;
              case 1:
                if (x !== null) {
                  var y = x.memoizedProps, E = x.memoizedState, h = t.stateNode, d = h.getSnapshotBeforeUpdate(t.elementType === t.type ? y : Qe(t.type, y), E);
                  h.__reactInternalSnapshotBeforeUpdate = d;
                }
                break;
              case 3:
                var v = t.stateNode.containerInfo;
                v.nodeType === 1 ? v.textContent = "" : v.nodeType === 9 && v.documentElement && v.removeChild(v.documentElement);
                break;
              case 5:
              case 6:
              case 4:
              case 17:
                break;
              default:
                throw Error(_(163));
            }
        } catch (S) {
          Z(t, t.return, S);
        }
        if (e = t.sibling, e !== null) {
          e.return = t.return, T = e;
          break;
        }
        T = t.return;
      }
  return x = ku, ku = !1, x;
}
function yr(e, t, n) {
  var r = t.updateQueue;
  if (r = r !== null ? r.lastEffect : null, r !== null) {
    var o = r = r.next;
    do {
      if ((o.tag & e) === e) {
        var l = o.destroy;
        o.destroy = void 0, l !== void 0 && ts(t, n, l);
      }
      o = o.next;
    } while (o !== r);
  }
}
function wl(e, t) {
  if (t = t.updateQueue, t = t !== null ? t.lastEffect : null, t !== null) {
    var n = t = t.next;
    do {
      if ((n.tag & e) === e) {
        var r = n.create;
        n.destroy = r();
      }
      n = n.next;
    } while (n !== t);
  }
}
function ns(e) {
  var t = e.ref;
  if (t !== null) {
    var n = e.stateNode;
    switch (e.tag) {
      case 5:
        e = n;
        break;
      default:
        e = n;
    }
    typeof t == "function" ? t(e) : t.current = e;
  }
}
function qd(e) {
  var t = e.alternate;
  t !== null && (e.alternate = null, qd(t)), e.child = null, e.deletions = null, e.sibling = null, e.tag === 5 && (t = e.stateNode, t !== null && (delete t[rt], delete t[Or], delete t[Vi], delete t[nv], delete t[rv])), e.stateNode = null, e.return = null, e.dependencies = null, e.memoizedProps = null, e.memoizedState = null, e.pendingProps = null, e.stateNode = null, e.updateQueue = null;
}
function ef(e) {
  return e.tag === 5 || e.tag === 3 || e.tag === 4;
}
function Cu(e) {
  e:
    for (; ; ) {
      for (; e.sibling === null; ) {
        if (e.return === null || ef(e.return))
          return null;
        e = e.return;
      }
      for (e.sibling.return = e.return, e = e.sibling; e.tag !== 5 && e.tag !== 6 && e.tag !== 18; ) {
        if (e.flags & 2 || e.child === null || e.tag === 4)
          continue e;
        e.child.return = e, e = e.child;
      }
      if (!(e.flags & 2))
        return e.stateNode;
    }
}
function rs(e, t, n) {
  var r = e.tag;
  if (r === 5 || r === 6)
    e = e.stateNode, t ? n.nodeType === 8 ? n.parentNode.insertBefore(e, t) : n.insertBefore(e, t) : (n.nodeType === 8 ? (t = n.parentNode, t.insertBefore(e, n)) : (t = n, t.appendChild(e)), n = n._reactRootContainer, n != null || t.onclick !== null || (t.onclick = Vo));
  else if (r !== 4 && (e = e.child, e !== null))
    for (rs(e, t, n), e = e.sibling; e !== null; )
      rs(e, t, n), e = e.sibling;
}
function os(e, t, n) {
  var r = e.tag;
  if (r === 5 || r === 6)
    e = e.stateNode, t ? n.insertBefore(e, t) : n.appendChild(e);
  else if (r !== 4 && (e = e.child, e !== null))
    for (os(e, t, n), e = e.sibling; e !== null; )
      os(e, t, n), e = e.sibling;
}
var fe = null, Ye = !1;
function Ct(e, t, n) {
  for (n = n.child; n !== null; )
    tf(e, t, n), n = n.sibling;
}
function tf(e, t, n) {
  if (lt && typeof lt.onCommitFiberUnmount == "function")
    try {
      lt.onCommitFiberUnmount(dl, n);
    } catch {
    }
  switch (n.tag) {
    case 5:
      ge || Nn(n, t);
    case 6:
      var r = fe, o = Ye;
      fe = null, Ct(e, t, n), fe = r, Ye = o, fe !== null && (Ye ? (e = fe, n = n.stateNode, e.nodeType === 8 ? e.parentNode.removeChild(n) : e.removeChild(n)) : fe.removeChild(n.stateNode));
      break;
    case 18:
      fe !== null && (Ye ? (e = fe, n = n.stateNode, e.nodeType === 8 ? Zl(e.parentNode, n) : e.nodeType === 1 && Zl(e, n), _r(e)) : Zl(fe, n.stateNode));
      break;
    case 4:
      r = fe, o = Ye, fe = n.stateNode.containerInfo, Ye = !0, Ct(e, t, n), fe = r, Ye = o;
      break;
    case 0:
    case 11:
    case 14:
    case 15:
      if (!ge && (r = n.updateQueue, r !== null && (r = r.lastEffect, r !== null))) {
        o = r = r.next;
        do {
          var l = o, i = l.destroy;
          l = l.tag, i !== void 0 && (l & 2 || l & 4) && ts(n, t, i), o = o.next;
        } while (o !== r);
      }
      Ct(e, t, n);
      break;
    case 1:
      if (!ge && (Nn(n, t), r = n.stateNode, typeof r.componentWillUnmount == "function"))
        try {
          r.props = n.memoizedProps, r.state = n.memoizedState, r.componentWillUnmount();
        } catch (s) {
          Z(n, t, s);
        }
      Ct(e, t, n);
      break;
    case 21:
      Ct(e, t, n);
      break;
    case 22:
      n.mode & 1 ? (ge = (r = ge) || n.memoizedState !== null, Ct(e, t, n), ge = r) : Ct(e, t, n);
      break;
    default:
      Ct(e, t, n);
  }
}
function Eu(e) {
  var t = e.updateQueue;
  if (t !== null) {
    e.updateQueue = null;
    var n = e.stateNode;
    n === null && (n = e.stateNode = new wv()), t.forEach(function(r) {
      var o = Tv.bind(null, e, r);
      n.has(r) || (n.add(r), r.then(o, o));
    });
  }
}
function He(e, t) {
  var n = t.deletions;
  if (n !== null)
    for (var r = 0; r < n.length; r++) {
      var o = n[r];
      try {
        var l = e, i = t, s = i;
        e:
          for (; s !== null; ) {
            switch (s.tag) {
              case 5:
                fe = s.stateNode, Ye = !1;
                break e;
              case 3:
                fe = s.stateNode.containerInfo, Ye = !0;
                break e;
              case 4:
                fe = s.stateNode.containerInfo, Ye = !0;
                break e;
            }
            s = s.return;
          }
        if (fe === null)
          throw Error(_(160));
        tf(l, i, o), fe = null, Ye = !1;
        var a = o.alternate;
        a !== null && (a.return = null), o.return = null;
      } catch (u) {
        Z(o, t, u);
      }
    }
  if (t.subtreeFlags & 12854)
    for (t = t.child; t !== null; )
      nf(t, e), t = t.sibling;
}
function nf(e, t) {
  var n = e.alternate, r = e.flags;
  switch (e.tag) {
    case 0:
    case 11:
    case 14:
    case 15:
      if (He(t, e), tt(e), r & 4) {
        try {
          yr(3, e, e.return), wl(3, e);
        } catch (y) {
          Z(e, e.return, y);
        }
        try {
          yr(5, e, e.return);
        } catch (y) {
          Z(e, e.return, y);
        }
      }
      break;
    case 1:
      He(t, e), tt(e), r & 512 && n !== null && Nn(n, n.return);
      break;
    case 5:
      if (He(t, e), tt(e), r & 512 && n !== null && Nn(n, n.return), e.flags & 32) {
        var o = e.stateNode;
        try {
          Cr(o, "");
        } catch (y) {
          Z(e, e.return, y);
        }
      }
      if (r & 4 && (o = e.stateNode, o != null)) {
        var l = e.memoizedProps, i = n !== null ? n.memoizedProps : l, s = e.type, a = e.updateQueue;
        if (e.updateQueue = null, a !== null)
          try {
            s === "input" && l.type === "radio" && l.name != null && Ec(o, l), Ri(s, i);
            var u = Ri(s, l);
            for (i = 0; i < a.length; i += 2) {
              var f = a[i], m = a[i + 1];
              f === "style" ? Tc(o, m) : f === "dangerouslySetInnerHTML" ? _c(o, m) : f === "children" ? Cr(o, m) : Ss(o, f, m, u);
            }
            switch (s) {
              case "input":
                Ci(o, l);
                break;
              case "textarea":
                Pc(o, l);
                break;
              case "select":
                var p = o._wrapperState.wasMultiple;
                o._wrapperState.wasMultiple = !!l.multiple;
                var w = l.value;
                w != null ? Rn(o, !!l.multiple, w, !1) : p !== !!l.multiple && (l.defaultValue != null ? Rn(
                  o,
                  !!l.multiple,
                  l.defaultValue,
                  !0
                ) : Rn(o, !!l.multiple, l.multiple ? [] : "", !1));
            }
            o[Or] = l;
          } catch (y) {
            Z(e, e.return, y);
          }
      }
      break;
    case 6:
      if (He(t, e), tt(e), r & 4) {
        if (e.stateNode === null)
          throw Error(_(162));
        o = e.stateNode, l = e.memoizedProps;
        try {
          o.nodeValue = l;
        } catch (y) {
          Z(e, e.return, y);
        }
      }
      break;
    case 3:
      if (He(t, e), tt(e), r & 4 && n !== null && n.memoizedState.isDehydrated)
        try {
          _r(t.containerInfo);
        } catch (y) {
          Z(e, e.return, y);
        }
      break;
    case 4:
      He(t, e), tt(e);
      break;
    case 13:
      He(t, e), tt(e), o = e.child, o.flags & 8192 && (l = o.memoizedState !== null, o.stateNode.isHidden = l, !l || o.alternate !== null && o.alternate.memoizedState !== null || (qs = ee())), r & 4 && Eu(e);
      break;
    case 22:
      if (f = n !== null && n.memoizedState !== null, e.mode & 1 ? (ge = (u = ge) || f, He(t, e), ge = u) : He(t, e), tt(e), r & 8192) {
        if (u = e.memoizedState !== null, (e.stateNode.isHidden = u) && !f && e.mode & 1)
          for (T = e, f = e.child; f !== null; ) {
            for (m = T = f; T !== null; ) {
              switch (p = T, w = p.child, p.tag) {
                case 0:
                case 11:
                case 14:
                case 15:
                  yr(4, p, p.return);
                  break;
                case 1:
                  Nn(p, p.return);
                  var x = p.stateNode;
                  if (typeof x.componentWillUnmount == "function") {
                    r = p, n = p.return;
                    try {
                      t = r, x.props = t.memoizedProps, x.state = t.memoizedState, x.componentWillUnmount();
                    } catch (y) {
                      Z(r, n, y);
                    }
                  }
                  break;
                case 5:
                  Nn(p, p.return);
                  break;
                case 22:
                  if (p.memoizedState !== null) {
                    Nu(m);
                    continue;
                  }
              }
              w !== null ? (w.return = p, T = w) : Nu(m);
            }
            f = f.sibling;
          }
        e:
          for (f = null, m = e; ; ) {
            if (m.tag === 5) {
              if (f === null) {
                f = m;
                try {
                  o = m.stateNode, u ? (l = o.style, typeof l.setProperty == "function" ? l.setProperty("display", "none", "important") : l.display = "none") : (s = m.stateNode, a = m.memoizedProps.style, i = a != null && a.hasOwnProperty("display") ? a.display : null, s.style.display = Rc("display", i));
                } catch (y) {
                  Z(e, e.return, y);
                }
              }
            } else if (m.tag === 6) {
              if (f === null)
                try {
                  m.stateNode.nodeValue = u ? "" : m.memoizedProps;
                } catch (y) {
                  Z(e, e.return, y);
                }
            } else if ((m.tag !== 22 && m.tag !== 23 || m.memoizedState === null || m === e) && m.child !== null) {
              m.child.return = m, m = m.child;
              continue;
            }
            if (m === e)
              break e;
            for (; m.sibling === null; ) {
              if (m.return === null || m.return === e)
                break e;
              f === m && (f = null), m = m.return;
            }
            f === m && (f = null), m.sibling.return = m.return, m = m.sibling;
          }
      }
      break;
    case 19:
      He(t, e), tt(e), r & 4 && Eu(e);
      break;
    case 21:
      break;
    default:
      He(
        t,
        e
      ), tt(e);
  }
}
function tt(e) {
  var t = e.flags;
  if (t & 2) {
    try {
      e: {
        for (var n = e.return; n !== null; ) {
          if (ef(n)) {
            var r = n;
            break e;
          }
          n = n.return;
        }
        throw Error(_(160));
      }
      switch (r.tag) {
        case 5:
          var o = r.stateNode;
          r.flags & 32 && (Cr(o, ""), r.flags &= -33);
          var l = Cu(e);
          os(e, l, o);
          break;
        case 3:
        case 4:
          var i = r.stateNode.containerInfo, s = Cu(e);
          rs(e, s, i);
          break;
        default:
          throw Error(_(161));
      }
    } catch (a) {
      Z(e, e.return, a);
    }
    e.flags &= -3;
  }
  t & 4096 && (e.flags &= -4097);
}
function xv(e, t, n) {
  T = e, rf(e);
}
function rf(e, t, n) {
  for (var r = (e.mode & 1) !== 0; T !== null; ) {
    var o = T, l = o.child;
    if (o.tag === 22 && r) {
      var i = o.memoizedState !== null || uo;
      if (!i) {
        var s = o.alternate, a = s !== null && s.memoizedState !== null || ge;
        s = uo;
        var u = ge;
        if (uo = i, (ge = a) && !u)
          for (T = o; T !== null; )
            i = T, a = i.child, i.tag === 22 && i.memoizedState !== null ? _u(o) : a !== null ? (a.return = i, T = a) : _u(o);
        for (; l !== null; )
          T = l, rf(l), l = l.sibling;
        T = o, uo = s, ge = u;
      }
      Pu(e);
    } else
      o.subtreeFlags & 8772 && l !== null ? (l.return = o, T = l) : Pu(e);
  }
}
function Pu(e) {
  for (; T !== null; ) {
    var t = T;
    if (t.flags & 8772) {
      var n = t.alternate;
      try {
        if (t.flags & 8772)
          switch (t.tag) {
            case 0:
            case 11:
            case 15:
              ge || wl(5, t);
              break;
            case 1:
              var r = t.stateNode;
              if (t.flags & 4 && !ge)
                if (n === null)
                  r.componentDidMount();
                else {
                  var o = t.elementType === t.type ? n.memoizedProps : Qe(t.type, n.memoizedProps);
                  r.componentDidUpdate(o, n.memoizedState, r.__reactInternalSnapshotBeforeUpdate);
                }
              var l = t.updateQueue;
              l !== null && uu(t, l, r);
              break;
            case 3:
              var i = t.updateQueue;
              if (i !== null) {
                if (n = null, t.child !== null)
                  switch (t.child.tag) {
                    case 5:
                      n = t.child.stateNode;
                      break;
                    case 1:
                      n = t.child.stateNode;
                  }
                uu(t, i, n);
              }
              break;
            case 5:
              var s = t.stateNode;
              if (n === null && t.flags & 4) {
                n = s;
                var a = t.memoizedProps;
                switch (t.type) {
                  case "button":
                  case "input":
                  case "select":
                  case "textarea":
                    a.autoFocus && n.focus();
                    break;
                  case "img":
                    a.src && (n.src = a.src);
                }
              }
              break;
            case 6:
              break;
            case 4:
              break;
            case 12:
              break;
            case 13:
              if (t.memoizedState === null) {
                var u = t.alternate;
                if (u !== null) {
                  var f = u.memoizedState;
                  if (f !== null) {
                    var m = f.dehydrated;
                    m !== null && _r(m);
                  }
                }
              }
              break;
            case 19:
            case 17:
            case 21:
            case 22:
            case 23:
            case 25:
              break;
            default:
              throw Error(_(163));
          }
        ge || t.flags & 512 && ns(t);
      } catch (p) {
        Z(t, t.return, p);
      }
    }
    if (t === e) {
      T = null;
      break;
    }
    if (n = t.sibling, n !== null) {
      n.return = t.return, T = n;
      break;
    }
    T = t.return;
  }
}
function Nu(e) {
  for (; T !== null; ) {
    var t = T;
    if (t === e) {
      T = null;
      break;
    }
    var n = t.sibling;
    if (n !== null) {
      n.return = t.return, T = n;
      break;
    }
    T = t.return;
  }
}
function _u(e) {
  for (; T !== null; ) {
    var t = T;
    try {
      switch (t.tag) {
        case 0:
        case 11:
        case 15:
          var n = t.return;
          try {
            wl(4, t);
          } catch (a) {
            Z(t, n, a);
          }
          break;
        case 1:
          var r = t.stateNode;
          if (typeof r.componentDidMount == "function") {
            var o = t.return;
            try {
              r.componentDidMount();
            } catch (a) {
              Z(t, o, a);
            }
          }
          var l = t.return;
          try {
            ns(t);
          } catch (a) {
            Z(t, l, a);
          }
          break;
        case 5:
          var i = t.return;
          try {
            ns(t);
          } catch (a) {
            Z(t, i, a);
          }
      }
    } catch (a) {
      Z(t, t.return, a);
    }
    if (t === e) {
      T = null;
      break;
    }
    var s = t.sibling;
    if (s !== null) {
      s.return = t.return, T = s;
      break;
    }
    T = t.return;
  }
}
var kv = Math.ceil, qo = yt.ReactCurrentDispatcher, Zs = yt.ReactCurrentOwner, $e = yt.ReactCurrentBatchConfig, M = 0, ce = null, re = null, pe = 0, Ae = 0, _n = Bt(0), se = 0, Mr = null, on = 0, Sl = 0, Js = 0, wr = null, Ee = null, qs = 0, Wn = 1 / 0, ut = null, el = !1, ls = null, zt = null, co = !1, jt = null, tl = 0, Sr = 0, is = null, To = -1, Ao = 0;
function Se() {
  return M & 6 ? ee() : To !== -1 ? To : To = ee();
}
function Mt(e) {
  return e.mode & 1 ? M & 2 && pe !== 0 ? pe & -pe : lv.transition !== null ? (Ao === 0 && (Ao = Wc()), Ao) : (e = F, e !== 0 || (e = window.event, e = e === void 0 ? 16 : Gc(e.type)), e) : 1;
}
function Xe(e, t, n, r) {
  if (50 < Sr)
    throw Sr = 0, is = null, Error(_(185));
  $r(e, n, r), (!(M & 2) || e !== ce) && (e === ce && (!(M & 2) && (Sl |= n), se === 4 && Tt(e, pe)), Re(e, r), n === 1 && M === 0 && !(t.mode & 1) && (Wn = ee() + 500, vl && Ht()));
}
function Re(e, t) {
  var n = e.callbackNode;
  lh(e, t);
  var r = Mo(e, e === ce ? pe : 0);
  if (r === 0)
    n !== null && Da(n), e.callbackNode = null, e.callbackPriority = 0;
  else if (t = r & -r, e.callbackPriority !== t) {
    if (n != null && Da(n), t === 1)
      e.tag === 0 ? ov(Ru.bind(null, e)) : pd(Ru.bind(null, e)), ev(function() {
        !(M & 6) && Ht();
      }), n = null;
    else {
      switch (Vc(r)) {
        case 1:
          n = Ps;
          break;
        case 4:
          n = Fc;
          break;
        case 16:
          n = zo;
          break;
        case 536870912:
          n = $c;
          break;
        default:
          n = zo;
      }
      n = ff(n, of.bind(null, e));
    }
    e.callbackPriority = t, e.callbackNode = n;
  }
}
function of(e, t) {
  if (To = -1, Ao = 0, M & 6)
    throw Error(_(327));
  var n = e.callbackNode;
  if (bn() && e.callbackNode !== n)
    return null;
  var r = Mo(e, e === ce ? pe : 0);
  if (r === 0)
    return null;
  if (r & 30 || r & e.expiredLanes || t)
    t = nl(e, r);
  else {
    t = r;
    var o = M;
    M |= 2;
    var l = sf();
    (ce !== e || pe !== t) && (ut = null, Wn = ee() + 500, Jt(e, t));
    do
      try {
        Pv();
        break;
      } catch (s) {
        lf(e, s);
      }
    while (1);
    Ms(), qo.current = l, M = o, re !== null ? t = 0 : (ce = null, pe = 0, t = se);
  }
  if (t !== 0) {
    if (t === 2 && (o = bi(e), o !== 0 && (r = o, t = ss(e, o))), t === 1)
      throw n = Mr, Jt(e, 0), Tt(e, r), Re(e, ee()), n;
    if (t === 6)
      Tt(e, r);
    else {
      if (o = e.current.alternate, !(r & 30) && !Cv(o) && (t = nl(e, r), t === 2 && (l = bi(e), l !== 0 && (r = l, t = ss(e, l))), t === 1))
        throw n = Mr, Jt(e, 0), Tt(e, r), Re(e, ee()), n;
      switch (e.finishedWork = o, e.finishedLanes = r, t) {
        case 0:
        case 1:
          throw Error(_(345));
        case 2:
          Gt(e, Ee, ut);
          break;
        case 3:
          if (Tt(e, r), (r & 130023424) === r && (t = qs + 500 - ee(), 10 < t)) {
            if (Mo(e, 0) !== 0)
              break;
            if (o = e.suspendedLanes, (o & r) !== r) {
              Se(), e.pingedLanes |= e.suspendedLanes & o;
              break;
            }
            e.timeoutHandle = Wi(Gt.bind(null, e, Ee, ut), t);
            break;
          }
          Gt(e, Ee, ut);
          break;
        case 4:
          if (Tt(e, r), (r & 4194240) === r)
            break;
          for (t = e.eventTimes, o = -1; 0 < r; ) {
            var i = 31 - Ke(r);
            l = 1 << i, i = t[i], i > o && (o = i), r &= ~l;
          }
          if (r = o, r = ee() - r, r = (120 > r ? 120 : 480 > r ? 480 : 1080 > r ? 1080 : 1920 > r ? 1920 : 3e3 > r ? 3e3 : 4320 > r ? 4320 : 1960 * kv(r / 1960)) - r, 10 < r) {
            e.timeoutHandle = Wi(Gt.bind(null, e, Ee, ut), r);
            break;
          }
          Gt(e, Ee, ut);
          break;
        case 5:
          Gt(e, Ee, ut);
          break;
        default:
          throw Error(_(329));
      }
    }
  }
  return Re(e, ee()), e.callbackNode === n ? of.bind(null, e) : null;
}
function ss(e, t) {
  var n = wr;
  return e.current.memoizedState.isDehydrated && (Jt(e, t).flags |= 256), e = nl(e, t), e !== 2 && (t = Ee, Ee = n, t !== null && as(t)), e;
}
function as(e) {
  Ee === null ? Ee = e : Ee.push.apply(Ee, e);
}
function Cv(e) {
  for (var t = e; ; ) {
    if (t.flags & 16384) {
      var n = t.updateQueue;
      if (n !== null && (n = n.stores, n !== null))
        for (var r = 0; r < n.length; r++) {
          var o = n[r], l = o.getSnapshot;
          o = o.value;
          try {
            if (!Ze(l(), o))
              return !1;
          } catch {
            return !1;
          }
        }
    }
    if (n = t.child, t.subtreeFlags & 16384 && n !== null)
      n.return = t, t = n;
    else {
      if (t === e)
        break;
      for (; t.sibling === null; ) {
        if (t.return === null || t.return === e)
          return !0;
        t = t.return;
      }
      t.sibling.return = t.return, t = t.sibling;
    }
  }
  return !0;
}
function Tt(e, t) {
  for (t &= ~Js, t &= ~Sl, e.suspendedLanes |= t, e.pingedLanes &= ~t, e = e.expirationTimes; 0 < t; ) {
    var n = 31 - Ke(t), r = 1 << n;
    e[n] = -1, t &= ~r;
  }
}
function Ru(e) {
  if (M & 6)
    throw Error(_(327));
  bn();
  var t = Mo(e, 0);
  if (!(t & 1))
    return Re(e, ee()), null;
  var n = nl(e, t);
  if (e.tag !== 0 && n === 2) {
    var r = bi(e);
    r !== 0 && (t = r, n = ss(e, r));
  }
  if (n === 1)
    throw n = Mr, Jt(e, 0), Tt(e, t), Re(e, ee()), n;
  if (n === 6)
    throw Error(_(345));
  return e.finishedWork = e.current.alternate, e.finishedLanes = t, Gt(e, Ee, ut), Re(e, ee()), null;
}
function ea(e, t) {
  var n = M;
  M |= 1;
  try {
    return e(t);
  } finally {
    M = n, M === 0 && (Wn = ee() + 500, vl && Ht());
  }
}
function ln(e) {
  jt !== null && jt.tag === 0 && !(M & 6) && bn();
  var t = M;
  M |= 1;
  var n = $e.transition, r = F;
  try {
    if ($e.transition = null, F = 1, e)
      return e();
  } finally {
    F = r, $e.transition = n, M = t, !(M & 6) && Ht();
  }
}
function ta() {
  Ae = _n.current, U(_n);
}
function Jt(e, t) {
  e.finishedWork = null, e.finishedLanes = 0;
  var n = e.timeoutHandle;
  if (n !== -1 && (e.timeoutHandle = -1, qh(n)), re !== null)
    for (n = re.return; n !== null; ) {
      var r = n;
      switch (Ls(r), r.tag) {
        case 1:
          r = r.type.childContextTypes, r != null && Uo();
          break;
        case 3:
          Fn(), U(Ne), U(ye), Bs();
          break;
        case 5:
          Us(r);
          break;
        case 4:
          Fn();
          break;
        case 13:
          U(Y);
          break;
        case 19:
          U(Y);
          break;
        case 10:
          Fs(r.type._context);
          break;
        case 22:
        case 23:
          ta();
      }
      n = n.return;
    }
  if (ce = e, re = e = Ft(e.current, null), pe = Ae = t, se = 0, Mr = null, Js = Sl = on = 0, Ee = wr = null, Xt !== null) {
    for (t = 0; t < Xt.length; t++)
      if (n = Xt[t], r = n.interleaved, r !== null) {
        n.interleaved = null;
        var o = r.next, l = n.pending;
        if (l !== null) {
          var i = l.next;
          l.next = o, r.next = i;
        }
        n.pending = r;
      }
    Xt = null;
  }
  return e;
}
function lf(e, t) {
  do {
    var n = re;
    try {
      if (Ms(), No.current = Jo, Zo) {
        for (var r = G.memoizedState; r !== null; ) {
          var o = r.queue;
          o !== null && (o.pending = null), r = r.next;
        }
        Zo = !1;
      }
      if (rn = 0, ue = ie = G = null, gr = !1, Lr = 0, Zs.current = null, n === null || n.return === null) {
        se = 1, Mr = t, re = null;
        break;
      }
      e: {
        var l = e, i = n.return, s = n, a = t;
        if (t = pe, s.flags |= 32768, a !== null && typeof a == "object" && typeof a.then == "function") {
          var u = a, f = s, m = f.tag;
          if (!(f.mode & 1) && (m === 0 || m === 11 || m === 15)) {
            var p = f.alternate;
            p ? (f.updateQueue = p.updateQueue, f.memoizedState = p.memoizedState, f.lanes = p.lanes) : (f.updateQueue = null, f.memoizedState = null);
          }
          var w = hu(i);
          if (w !== null) {
            w.flags &= -257, vu(w, i, s, l, t), w.mode & 1 && mu(l, u, t), t = w, a = u;
            var x = t.updateQueue;
            if (x === null) {
              var y = /* @__PURE__ */ new Set();
              y.add(a), t.updateQueue = y;
            } else
              x.add(a);
            break e;
          } else {
            if (!(t & 1)) {
              mu(l, u, t), na();
              break e;
            }
            a = Error(_(426));
          }
        } else if (H && s.mode & 1) {
          var E = hu(i);
          if (E !== null) {
            !(E.flags & 65536) && (E.flags |= 256), vu(E, i, s, l, t), Ds($n(a, s));
            break e;
          }
        }
        l = a = $n(a, s), se !== 4 && (se = 2), wr === null ? wr = [l] : wr.push(l), l = i;
        do {
          switch (l.tag) {
            case 3:
              l.flags |= 65536, t &= -t, l.lanes |= t;
              var h = Vd(l, a, t);
              au(l, h);
              break e;
            case 1:
              s = a;
              var d = l.type, v = l.stateNode;
              if (!(l.flags & 128) && (typeof d.getDerivedStateFromError == "function" || v !== null && typeof v.componentDidCatch == "function" && (zt === null || !zt.has(v)))) {
                l.flags |= 65536, t &= -t, l.lanes |= t;
                var S = Ud(l, s, t);
                au(l, S);
                break e;
              }
          }
          l = l.return;
        } while (l !== null);
      }
      uf(n);
    } catch (P) {
      t = P, re === n && n !== null && (re = n = n.return);
      continue;
    }
    break;
  } while (1);
}
function sf() {
  var e = qo.current;
  return qo.current = Jo, e === null ? Jo : e;
}
function na() {
  (se === 0 || se === 3 || se === 2) && (se = 4), ce === null || !(on & 268435455) && !(Sl & 268435455) || Tt(ce, pe);
}
function nl(e, t) {
  var n = M;
  M |= 2;
  var r = sf();
  (ce !== e || pe !== t) && (ut = null, Jt(e, t));
  do
    try {
      Ev();
      break;
    } catch (o) {
      lf(e, o);
    }
  while (1);
  if (Ms(), M = n, qo.current = r, re !== null)
    throw Error(_(261));
  return ce = null, pe = 0, se;
}
function Ev() {
  for (; re !== null; )
    af(re);
}
function Pv() {
  for (; re !== null && !Xm(); )
    af(re);
}
function af(e) {
  var t = df(e.alternate, e, Ae);
  e.memoizedProps = e.pendingProps, t === null ? uf(e) : re = t, Zs.current = null;
}
function uf(e) {
  var t = e;
  do {
    var n = t.alternate;
    if (e = t.return, t.flags & 32768) {
      if (n = yv(n, t), n !== null) {
        n.flags &= 32767, re = n;
        return;
      }
      if (e !== null)
        e.flags |= 32768, e.subtreeFlags = 0, e.deletions = null;
      else {
        se = 6, re = null;
        return;
      }
    } else if (n = gv(n, t, Ae), n !== null) {
      re = n;
      return;
    }
    if (t = t.sibling, t !== null) {
      re = t;
      return;
    }
    re = t = e;
  } while (t !== null);
  se === 0 && (se = 5);
}
function Gt(e, t, n) {
  var r = F, o = $e.transition;
  try {
    $e.transition = null, F = 1, Nv(e, t, n, r);
  } finally {
    $e.transition = o, F = r;
  }
  return null;
}
function Nv(e, t, n, r) {
  do
    bn();
  while (jt !== null);
  if (M & 6)
    throw Error(_(327));
  n = e.finishedWork;
  var o = e.finishedLanes;
  if (n === null)
    return null;
  if (e.finishedWork = null, e.finishedLanes = 0, n === e.current)
    throw Error(_(177));
  e.callbackNode = null, e.callbackPriority = 0;
  var l = n.lanes | n.childLanes;
  if (ih(e, l), e === ce && (re = ce = null, pe = 0), !(n.subtreeFlags & 2064) && !(n.flags & 2064) || co || (co = !0, ff(zo, function() {
    return bn(), null;
  })), l = (n.flags & 15990) !== 0, n.subtreeFlags & 15990 || l) {
    l = $e.transition, $e.transition = null;
    var i = F;
    F = 1;
    var s = M;
    M |= 4, Zs.current = null, Sv(e, n), nf(n, e), Qh(Fi), Fo = !!Mi, Fi = Mi = null, e.current = n, xv(n), Zm(), M = s, F = i, $e.transition = l;
  } else
    e.current = n;
  if (co && (co = !1, jt = e, tl = o), l = e.pendingLanes, l === 0 && (zt = null), eh(n.stateNode), Re(e, ee()), t !== null)
    for (r = e.onRecoverableError, n = 0; n < t.length; n++)
      o = t[n], r(o.value, { componentStack: o.stack, digest: o.digest });
  if (el)
    throw el = !1, e = ls, ls = null, e;
  return tl & 1 && e.tag !== 0 && bn(), l = e.pendingLanes, l & 1 ? e === is ? Sr++ : (Sr = 0, is = e) : Sr = 0, Ht(), null;
}
function bn() {
  if (jt !== null) {
    var e = Vc(tl), t = $e.transition, n = F;
    try {
      if ($e.transition = null, F = 16 > e ? 16 : e, jt === null)
        var r = !1;
      else {
        if (e = jt, jt = null, tl = 0, M & 6)
          throw Error(_(331));
        var o = M;
        for (M |= 4, T = e.current; T !== null; ) {
          var l = T, i = l.child;
          if (T.flags & 16) {
            var s = l.deletions;
            if (s !== null) {
              for (var a = 0; a < s.length; a++) {
                var u = s[a];
                for (T = u; T !== null; ) {
                  var f = T;
                  switch (f.tag) {
                    case 0:
                    case 11:
                    case 15:
                      yr(8, f, l);
                  }
                  var m = f.child;
                  if (m !== null)
                    m.return = f, T = m;
                  else
                    for (; T !== null; ) {
                      f = T;
                      var p = f.sibling, w = f.return;
                      if (qd(f), f === u) {
                        T = null;
                        break;
                      }
                      if (p !== null) {
                        p.return = w, T = p;
                        break;
                      }
                      T = w;
                    }
                }
              }
              var x = l.alternate;
              if (x !== null) {
                var y = x.child;
                if (y !== null) {
                  x.child = null;
                  do {
                    var E = y.sibling;
                    y.sibling = null, y = E;
                  } while (y !== null);
                }
              }
              T = l;
            }
          }
          if (l.subtreeFlags & 2064 && i !== null)
            i.return = l, T = i;
          else
            e:
              for (; T !== null; ) {
                if (l = T, l.flags & 2048)
                  switch (l.tag) {
                    case 0:
                    case 11:
                    case 15:
                      yr(9, l, l.return);
                  }
                var h = l.sibling;
                if (h !== null) {
                  h.return = l.return, T = h;
                  break e;
                }
                T = l.return;
              }
        }
        var d = e.current;
        for (T = d; T !== null; ) {
          i = T;
          var v = i.child;
          if (i.subtreeFlags & 2064 && v !== null)
            v.return = i, T = v;
          else
            e:
              for (i = d; T !== null; ) {
                if (s = T, s.flags & 2048)
                  try {
                    switch (s.tag) {
                      case 0:
                      case 11:
                      case 15:
                        wl(9, s);
                    }
                  } catch (P) {
                    Z(s, s.return, P);
                  }
                if (s === i) {
                  T = null;
                  break e;
                }
                var S = s.sibling;
                if (S !== null) {
                  S.return = s.return, T = S;
                  break e;
                }
                T = s.return;
              }
        }
        if (M = o, Ht(), lt && typeof lt.onPostCommitFiberRoot == "function")
          try {
            lt.onPostCommitFiberRoot(dl, e);
          } catch {
          }
        r = !0;
      }
      return r;
    } finally {
      F = n, $e.transition = t;
    }
  }
  return !1;
}
function Tu(e, t, n) {
  t = $n(n, t), t = Vd(e, t, 1), e = Dt(e, t, 1), t = Se(), e !== null && ($r(e, 1, t), Re(e, t));
}
function Z(e, t, n) {
  if (e.tag === 3)
    Tu(e, e, n);
  else
    for (; t !== null; ) {
      if (t.tag === 3) {
        Tu(t, e, n);
        break;
      } else if (t.tag === 1) {
        var r = t.stateNode;
        if (typeof t.type.getDerivedStateFromError == "function" || typeof r.componentDidCatch == "function" && (zt === null || !zt.has(r))) {
          e = $n(n, e), e = Ud(t, e, 1), t = Dt(t, e, 1), e = Se(), t !== null && ($r(t, 1, e), Re(t, e));
          break;
        }
      }
      t = t.return;
    }
}
function _v(e, t, n) {
  var r = e.pingCache;
  r !== null && r.delete(t), t = Se(), e.pingedLanes |= e.suspendedLanes & n, ce === e && (pe & n) === n && (se === 4 || se === 3 && (pe & 130023424) === pe && 500 > ee() - qs ? Jt(e, 0) : Js |= n), Re(e, t);
}
function cf(e, t) {
  t === 0 && (e.mode & 1 ? (t = eo, eo <<= 1, !(eo & 130023424) && (eo = 4194304)) : t = 1);
  var n = Se();
  e = vt(e, t), e !== null && ($r(e, t, n), Re(e, n));
}
function Rv(e) {
  var t = e.memoizedState, n = 0;
  t !== null && (n = t.retryLane), cf(e, n);
}
function Tv(e, t) {
  var n = 0;
  switch (e.tag) {
    case 13:
      var r = e.stateNode, o = e.memoizedState;
      o !== null && (n = o.retryLane);
      break;
    case 19:
      r = e.stateNode;
      break;
    default:
      throw Error(_(314));
  }
  r !== null && r.delete(t), cf(e, n);
}
var df;
df = function(e, t, n) {
  if (e !== null)
    if (e.memoizedProps !== t.pendingProps || Ne.current)
      Pe = !0;
    else {
      if (!(e.lanes & n) && !(t.flags & 128))
        return Pe = !1, vv(e, t, n);
      Pe = !!(e.flags & 131072);
    }
  else
    Pe = !1, H && t.flags & 1048576 && md(t, Qo, t.index);
  switch (t.lanes = 0, t.tag) {
    case 2:
      var r = t.type;
      Ro(e, t), e = t.pendingProps;
      var o = Dn(t, ye.current);
      On(t, n), o = Qs(null, t, r, e, o, n);
      var l = Ys();
      return t.flags |= 1, typeof o == "object" && o !== null && typeof o.render == "function" && o.$$typeof === void 0 ? (t.tag = 1, t.memoizedState = null, t.updateQueue = null, _e(r) ? (l = !0, Bo(t)) : l = !1, t.memoizedState = o.state !== null && o.state !== void 0 ? o.state : null, Ws(t), o.updater = yl, t.stateNode = o, o._reactInternals = t, Gi(t, r, e, n), t = Zi(null, t, r, !0, l, n)) : (t.tag = 0, H && l && Is(t), we(null, t, o, n), t = t.child), t;
    case 16:
      r = t.elementType;
      e: {
        switch (Ro(e, t), e = t.pendingProps, o = r._init, r = o(r._payload), t.type = r, o = t.tag = jv(r), e = Qe(r, e), o) {
          case 0:
            t = Xi(null, t, r, e, n);
            break e;
          case 1:
            t = wu(null, t, r, e, n);
            break e;
          case 11:
            t = gu(null, t, r, e, n);
            break e;
          case 14:
            t = yu(null, t, r, Qe(r.type, e), n);
            break e;
        }
        throw Error(_(
          306,
          r,
          ""
        ));
      }
      return t;
    case 0:
      return r = t.type, o = t.pendingProps, o = t.elementType === r ? o : Qe(r, o), Xi(e, t, r, o, n);
    case 1:
      return r = t.type, o = t.pendingProps, o = t.elementType === r ? o : Qe(r, o), wu(e, t, r, o, n);
    case 3:
      e: {
        if (Yd(t), e === null)
          throw Error(_(387));
        r = t.pendingProps, l = t.memoizedState, o = l.element, Sd(e, t), Ko(t, r, null, n);
        var i = t.memoizedState;
        if (r = i.element, l.isDehydrated)
          if (l = { element: r, isDehydrated: !1, cache: i.cache, pendingSuspenseBoundaries: i.pendingSuspenseBoundaries, transitions: i.transitions }, t.updateQueue.baseState = l, t.memoizedState = l, t.flags & 256) {
            o = $n(Error(_(423)), t), t = Su(e, t, r, n, o);
            break e;
          } else if (r !== o) {
            o = $n(Error(_(424)), t), t = Su(e, t, r, n, o);
            break e;
          } else
            for (je = Lt(t.stateNode.containerInfo.firstChild), Oe = t, H = !0, Ge = null, n = yd(t, null, r, n), t.child = n; n; )
              n.flags = n.flags & -3 | 4096, n = n.sibling;
        else {
          if (zn(), r === o) {
            t = gt(e, t, n);
            break e;
          }
          we(e, t, r, n);
        }
        t = t.child;
      }
      return t;
    case 5:
      return xd(t), e === null && Hi(t), r = t.type, o = t.pendingProps, l = e !== null ? e.memoizedProps : null, i = o.children, $i(r, o) ? i = null : l !== null && $i(r, l) && (t.flags |= 32), Qd(e, t), we(e, t, i, n), t.child;
    case 6:
      return e === null && Hi(t), null;
    case 13:
      return Gd(e, t, n);
    case 4:
      return Vs(t, t.stateNode.containerInfo), r = t.pendingProps, e === null ? t.child = Mn(t, null, r, n) : we(e, t, r, n), t.child;
    case 11:
      return r = t.type, o = t.pendingProps, o = t.elementType === r ? o : Qe(r, o), gu(e, t, r, o, n);
    case 7:
      return we(e, t, t.pendingProps, n), t.child;
    case 8:
      return we(e, t, t.pendingProps.children, n), t.child;
    case 12:
      return we(e, t, t.pendingProps.children, n), t.child;
    case 10:
      e: {
        if (r = t.type._context, o = t.pendingProps, l = t.memoizedProps, i = o.value, W(Yo, r._currentValue), r._currentValue = i, l !== null)
          if (Ze(l.value, i)) {
            if (l.children === o.children && !Ne.current) {
              t = gt(e, t, n);
              break e;
            }
          } else
            for (l = t.child, l !== null && (l.return = t); l !== null; ) {
              var s = l.dependencies;
              if (s !== null) {
                i = l.child;
                for (var a = s.firstContext; a !== null; ) {
                  if (a.context === r) {
                    if (l.tag === 1) {
                      a = pt(-1, n & -n), a.tag = 2;
                      var u = l.updateQueue;
                      if (u !== null) {
                        u = u.shared;
                        var f = u.pending;
                        f === null ? a.next = a : (a.next = f.next, f.next = a), u.pending = a;
                      }
                    }
                    l.lanes |= n, a = l.alternate, a !== null && (a.lanes |= n), Qi(
                      l.return,
                      n,
                      t
                    ), s.lanes |= n;
                    break;
                  }
                  a = a.next;
                }
              } else if (l.tag === 10)
                i = l.type === t.type ? null : l.child;
              else if (l.tag === 18) {
                if (i = l.return, i === null)
                  throw Error(_(341));
                i.lanes |= n, s = i.alternate, s !== null && (s.lanes |= n), Qi(i, n, t), i = l.sibling;
              } else
                i = l.child;
              if (i !== null)
                i.return = l;
              else
                for (i = l; i !== null; ) {
                  if (i === t) {
                    i = null;
                    break;
                  }
                  if (l = i.sibling, l !== null) {
                    l.return = i.return, i = l;
                    break;
                  }
                  i = i.return;
                }
              l = i;
            }
        we(e, t, o.children, n), t = t.child;
      }
      return t;
    case 9:
      return o = t.type, r = t.pendingProps.children, On(t, n), o = We(o), r = r(o), t.flags |= 1, we(e, t, r, n), t.child;
    case 14:
      return r = t.type, o = Qe(r, t.pendingProps), o = Qe(r.type, o), yu(e, t, r, o, n);
    case 15:
      return Bd(e, t, t.type, t.pendingProps, n);
    case 17:
      return r = t.type, o = t.pendingProps, o = t.elementType === r ? o : Qe(r, o), Ro(e, t), t.tag = 1, _e(r) ? (e = !0, Bo(t)) : e = !1, On(t, n), Wd(t, r, o), Gi(t, r, o, n), Zi(null, t, r, !0, e, n);
    case 19:
      return Kd(e, t, n);
    case 22:
      return Hd(e, t, n);
  }
  throw Error(_(156, t.tag));
};
function ff(e, t) {
  return Mc(e, t);
}
function Av(e, t, n, r) {
  this.tag = e, this.key = n, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.ref = null, this.pendingProps = t, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = r, this.subtreeFlags = this.flags = 0, this.deletions = null, this.childLanes = this.lanes = 0, this.alternate = null;
}
function Fe(e, t, n, r) {
  return new Av(e, t, n, r);
}
function ra(e) {
  return e = e.prototype, !(!e || !e.isReactComponent);
}
function jv(e) {
  if (typeof e == "function")
    return ra(e) ? 1 : 0;
  if (e != null) {
    if (e = e.$$typeof, e === ks)
      return 11;
    if (e === Cs)
      return 14;
  }
  return 2;
}
function Ft(e, t) {
  var n = e.alternate;
  return n === null ? (n = Fe(e.tag, t, e.key, e.mode), n.elementType = e.elementType, n.type = e.type, n.stateNode = e.stateNode, n.alternate = e, e.alternate = n) : (n.pendingProps = t, n.type = e.type, n.flags = 0, n.subtreeFlags = 0, n.deletions = null), n.flags = e.flags & 14680064, n.childLanes = e.childLanes, n.lanes = e.lanes, n.child = e.child, n.memoizedProps = e.memoizedProps, n.memoizedState = e.memoizedState, n.updateQueue = e.updateQueue, t = e.dependencies, n.dependencies = t === null ? null : { lanes: t.lanes, firstContext: t.firstContext }, n.sibling = e.sibling, n.index = e.index, n.ref = e.ref, n;
}
function jo(e, t, n, r, o, l) {
  var i = 2;
  if (r = e, typeof e == "function")
    ra(e) && (i = 1);
  else if (typeof e == "string")
    i = 5;
  else
    e:
      switch (e) {
        case gn:
          return qt(n.children, o, l, t);
        case xs:
          i = 8, o |= 8;
          break;
        case yi:
          return e = Fe(12, n, t, o | 2), e.elementType = yi, e.lanes = l, e;
        case wi:
          return e = Fe(13, n, t, o), e.elementType = wi, e.lanes = l, e;
        case Si:
          return e = Fe(19, n, t, o), e.elementType = Si, e.lanes = l, e;
        case xc:
          return xl(n, o, l, t);
        default:
          if (typeof e == "object" && e !== null)
            switch (e.$$typeof) {
              case wc:
                i = 10;
                break e;
              case Sc:
                i = 9;
                break e;
              case ks:
                i = 11;
                break e;
              case Cs:
                i = 14;
                break e;
              case Nt:
                i = 16, r = null;
                break e;
            }
          throw Error(_(130, e == null ? e : typeof e, ""));
      }
  return t = Fe(i, n, t, o), t.elementType = e, t.type = r, t.lanes = l, t;
}
function qt(e, t, n, r) {
  return e = Fe(7, e, r, t), e.lanes = n, e;
}
function xl(e, t, n, r) {
  return e = Fe(22, e, r, t), e.elementType = xc, e.lanes = n, e.stateNode = { isHidden: !1 }, e;
}
function li(e, t, n) {
  return e = Fe(6, e, null, t), e.lanes = n, e;
}
function ii(e, t, n) {
  return t = Fe(4, e.children !== null ? e.children : [], e.key, t), t.lanes = n, t.stateNode = { containerInfo: e.containerInfo, pendingChildren: null, implementation: e.implementation }, t;
}
function Ov(e, t, n, r, o) {
  this.tag = t, this.containerInfo = e, this.finishedWork = this.pingCache = this.current = this.pendingChildren = null, this.timeoutHandle = -1, this.callbackNode = this.pendingContext = this.context = null, this.callbackPriority = 0, this.eventTimes = $l(0), this.expirationTimes = $l(-1), this.entangledLanes = this.finishedLanes = this.mutableReadLanes = this.expiredLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0, this.entanglements = $l(0), this.identifierPrefix = r, this.onRecoverableError = o, this.mutableSourceEagerHydrationData = null;
}
function oa(e, t, n, r, o, l, i, s, a) {
  return e = new Ov(e, t, n, s, a), t === 1 ? (t = 1, l === !0 && (t |= 8)) : t = 0, l = Fe(3, null, null, t), e.current = l, l.stateNode = e, l.memoizedState = { element: r, isDehydrated: n, cache: null, transitions: null, pendingSuspenseBoundaries: null }, Ws(l), e;
}
function bv(e, t, n) {
  var r = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
  return { $$typeof: vn, key: r == null ? null : "" + r, children: e, containerInfo: t, implementation: n };
}
function pf(e) {
  if (!e)
    return Wt;
  e = e._reactInternals;
  e: {
    if (un(e) !== e || e.tag !== 1)
      throw Error(_(170));
    var t = e;
    do {
      switch (t.tag) {
        case 3:
          t = t.stateNode.context;
          break e;
        case 1:
          if (_e(t.type)) {
            t = t.stateNode.__reactInternalMemoizedMergedChildContext;
            break e;
          }
      }
      t = t.return;
    } while (t !== null);
    throw Error(_(171));
  }
  if (e.tag === 1) {
    var n = e.type;
    if (_e(n))
      return fd(e, n, t);
  }
  return t;
}
function mf(e, t, n, r, o, l, i, s, a) {
  return e = oa(n, r, !0, e, o, l, i, s, a), e.context = pf(null), n = e.current, r = Se(), o = Mt(n), l = pt(r, o), l.callback = t ?? null, Dt(n, l, o), e.current.lanes = o, $r(e, o, r), Re(e, r), e;
}
function kl(e, t, n, r) {
  var o = t.current, l = Se(), i = Mt(o);
  return n = pf(n), t.context === null ? t.context = n : t.pendingContext = n, t = pt(l, i), t.payload = { element: e }, r = r === void 0 ? null : r, r !== null && (t.callback = r), e = Dt(o, t, i), e !== null && (Xe(e, o, i, l), Po(e, o, i)), i;
}
function rl(e) {
  if (e = e.current, !e.child)
    return null;
  switch (e.child.tag) {
    case 5:
      return e.child.stateNode;
    default:
      return e.child.stateNode;
  }
}
function Au(e, t) {
  if (e = e.memoizedState, e !== null && e.dehydrated !== null) {
    var n = e.retryLane;
    e.retryLane = n !== 0 && n < t ? n : t;
  }
}
function la(e, t) {
  Au(e, t), (e = e.alternate) && Au(e, t);
}
function Iv() {
  return null;
}
var hf = typeof reportError == "function" ? reportError : function(e) {
  console.error(e);
};
function ia(e) {
  this._internalRoot = e;
}
Cl.prototype.render = ia.prototype.render = function(e) {
  var t = this._internalRoot;
  if (t === null)
    throw Error(_(409));
  kl(e, t, null, null);
};
Cl.prototype.unmount = ia.prototype.unmount = function() {
  var e = this._internalRoot;
  if (e !== null) {
    this._internalRoot = null;
    var t = e.containerInfo;
    ln(function() {
      kl(null, e, null, null);
    }), t[ht] = null;
  }
};
function Cl(e) {
  this._internalRoot = e;
}
Cl.prototype.unstable_scheduleHydration = function(e) {
  if (e) {
    var t = Hc();
    e = { blockedOn: null, target: e, priority: t };
    for (var n = 0; n < Rt.length && t !== 0 && t < Rt[n].priority; n++)
      ;
    Rt.splice(n, 0, e), n === 0 && Yc(e);
  }
};
function sa(e) {
  return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11);
}
function El(e) {
  return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11 && (e.nodeType !== 8 || e.nodeValue !== " react-mount-point-unstable "));
}
function ju() {
}
function Lv(e, t, n, r, o) {
  if (o) {
    if (typeof r == "function") {
      var l = r;
      r = function() {
        var u = rl(i);
        l.call(u);
      };
    }
    var i = mf(t, r, e, 0, null, !1, !1, "", ju);
    return e._reactRootContainer = i, e[ht] = i.current, Ar(e.nodeType === 8 ? e.parentNode : e), ln(), i;
  }
  for (; o = e.lastChild; )
    e.removeChild(o);
  if (typeof r == "function") {
    var s = r;
    r = function() {
      var u = rl(a);
      s.call(u);
    };
  }
  var a = oa(e, 0, !1, null, null, !1, !1, "", ju);
  return e._reactRootContainer = a, e[ht] = a.current, Ar(e.nodeType === 8 ? e.parentNode : e), ln(function() {
    kl(t, a, n, r);
  }), a;
}
function Pl(e, t, n, r, o) {
  var l = n._reactRootContainer;
  if (l) {
    var i = l;
    if (typeof o == "function") {
      var s = o;
      o = function() {
        var a = rl(i);
        s.call(a);
      };
    }
    kl(t, i, e, o);
  } else
    i = Lv(n, t, e, o, r);
  return rl(i);
}
Uc = function(e) {
  switch (e.tag) {
    case 3:
      var t = e.stateNode;
      if (t.current.memoizedState.isDehydrated) {
        var n = ir(t.pendingLanes);
        n !== 0 && (Ns(t, n | 1), Re(t, ee()), !(M & 6) && (Wn = ee() + 500, Ht()));
      }
      break;
    case 13:
      ln(function() {
        var r = vt(e, 1);
        if (r !== null) {
          var o = Se();
          Xe(r, e, 1, o);
        }
      }), la(e, 1);
  }
};
_s = function(e) {
  if (e.tag === 13) {
    var t = vt(e, 134217728);
    if (t !== null) {
      var n = Se();
      Xe(t, e, 134217728, n);
    }
    la(e, 134217728);
  }
};
Bc = function(e) {
  if (e.tag === 13) {
    var t = Mt(e), n = vt(e, t);
    if (n !== null) {
      var r = Se();
      Xe(n, e, t, r);
    }
    la(e, t);
  }
};
Hc = function() {
  return F;
};
Qc = function(e, t) {
  var n = F;
  try {
    return F = e, t();
  } finally {
    F = n;
  }
};
Ai = function(e, t, n) {
  switch (t) {
    case "input":
      if (Ci(e, n), t = n.name, n.type === "radio" && t != null) {
        for (n = e; n.parentNode; )
          n = n.parentNode;
        for (n = n.querySelectorAll("input[name=" + JSON.stringify("" + t) + '][type="radio"]'), t = 0; t < n.length; t++) {
          var r = n[t];
          if (r !== e && r.form === e.form) {
            var o = hl(r);
            if (!o)
              throw Error(_(90));
            Cc(r), Ci(r, o);
          }
        }
      }
      break;
    case "textarea":
      Pc(e, n);
      break;
    case "select":
      t = n.value, t != null && Rn(e, !!n.multiple, t, !1);
  }
};
Oc = ea;
bc = ln;
var Dv = { usingClientEntryPoint: !1, Events: [Vr, xn, hl, Ac, jc, ea] }, nr = { findFiberByHostInstance: Kt, bundleType: 0, version: "18.3.1", rendererPackageName: "react-dom" }, zv = { bundleType: nr.bundleType, version: nr.version, rendererPackageName: nr.rendererPackageName, rendererConfig: nr.rendererConfig, overrideHookState: null, overrideHookStateDeletePath: null, overrideHookStateRenamePath: null, overrideProps: null, overridePropsDeletePath: null, overridePropsRenamePath: null, setErrorHandler: null, setSuspenseHandler: null, scheduleUpdate: null, currentDispatcherRef: yt.ReactCurrentDispatcher, findHostInstanceByFiber: function(e) {
  return e = Dc(e), e === null ? null : e.stateNode;
}, findFiberByHostInstance: nr.findFiberByHostInstance || Iv, findHostInstancesForRefresh: null, scheduleRefresh: null, scheduleRoot: null, setRefreshHandler: null, getCurrentFiber: null, reconcilerVersion: "18.3.1-next-f1338f8080-20240426" };
if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u") {
  var fo = __REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!fo.isDisabled && fo.supportsFiber)
    try {
      dl = fo.inject(zv), lt = fo;
    } catch {
    }
}
Ie.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = Dv;
Ie.createPortal = function(e, t) {
  var n = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
  if (!sa(t))
    throw Error(_(200));
  return bv(e, t, null, n);
};
Ie.createRoot = function(e, t) {
  if (!sa(e))
    throw Error(_(299));
  var n = !1, r = "", o = hf;
  return t != null && (t.unstable_strictMode === !0 && (n = !0), t.identifierPrefix !== void 0 && (r = t.identifierPrefix), t.onRecoverableError !== void 0 && (o = t.onRecoverableError)), t = oa(e, 1, !1, null, null, n, !1, r, o), e[ht] = t.current, Ar(e.nodeType === 8 ? e.parentNode : e), new ia(t);
};
Ie.findDOMNode = function(e) {
  if (e == null)
    return null;
  if (e.nodeType === 1)
    return e;
  var t = e._reactInternals;
  if (t === void 0)
    throw typeof e.render == "function" ? Error(_(188)) : (e = Object.keys(e).join(","), Error(_(268, e)));
  return e = Dc(t), e = e === null ? null : e.stateNode, e;
};
Ie.flushSync = function(e) {
  return ln(e);
};
Ie.hydrate = function(e, t, n) {
  if (!El(t))
    throw Error(_(200));
  return Pl(null, e, t, !0, n);
};
Ie.hydrateRoot = function(e, t, n) {
  if (!sa(e))
    throw Error(_(405));
  var r = n != null && n.hydratedSources || null, o = !1, l = "", i = hf;
  if (n != null && (n.unstable_strictMode === !0 && (o = !0), n.identifierPrefix !== void 0 && (l = n.identifierPrefix), n.onRecoverableError !== void 0 && (i = n.onRecoverableError)), t = mf(t, null, e, 1, n ?? null, o, !1, l, i), e[ht] = t.current, Ar(e), r)
    for (e = 0; e < r.length; e++)
      n = r[e], o = n._getVersion, o = o(n._source), t.mutableSourceEagerHydrationData == null ? t.mutableSourceEagerHydrationData = [n, o] : t.mutableSourceEagerHydrationData.push(
        n,
        o
      );
  return new Cl(t);
};
Ie.render = function(e, t, n) {
  if (!El(t))
    throw Error(_(200));
  return Pl(null, e, t, !1, n);
};
Ie.unmountComponentAtNode = function(e) {
  if (!El(e))
    throw Error(_(40));
  return e._reactRootContainer ? (ln(function() {
    Pl(null, null, e, !1, function() {
      e._reactRootContainer = null, e[ht] = null;
    });
  }), !0) : !1;
};
Ie.unstable_batchedUpdates = ea;
Ie.unstable_renderSubtreeIntoContainer = function(e, t, n, r) {
  if (!El(n))
    throw Error(_(200));
  if (e == null || e._reactInternals === void 0)
    throw Error(_(38));
  return Pl(e, t, n, !1, r);
};
Ie.version = "18.3.1-next-f1338f8080-20240426";
function vf() {
  if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function"))
    try {
      __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(vf);
    } catch (e) {
      console.error(e);
    }
}
vf(), hc.exports = Ie;
var aa = hc.exports;
const Mv = /* @__PURE__ */ rc(aa);
var Ou = aa;
vi.createRoot = Ou.createRoot, vi.hydrateRoot = Ou.hydrateRoot;
function gf(e) {
  var t, n, r = "";
  if (typeof e == "string" || typeof e == "number")
    r += e;
  else if (typeof e == "object")
    if (Array.isArray(e)) {
      var o = e.length;
      for (t = 0; t < o; t++)
        e[t] && (n = gf(e[t])) && (r && (r += " "), r += n);
    } else
      for (n in e)
        e[n] && (r && (r += " "), r += n);
  return r;
}
function yf() {
  for (var e, t, n = 0, r = "", o = arguments.length; n < o; n++)
    (e = arguments[n]) && (t = gf(e)) && (r && (r += " "), r += t);
  return r;
}
const Fv = (e, t) => {
  const n = new Array(e.length + t.length);
  for (let r = 0; r < e.length; r++)
    n[r] = e[r];
  for (let r = 0; r < t.length; r++)
    n[e.length + r] = t[r];
  return n;
}, $v = (e, t) => ({
  classGroupId: e,
  validator: t
}), wf = (e = /* @__PURE__ */ new Map(), t = null, n) => ({
  nextPart: e,
  validators: t,
  classGroupId: n
}), ol = "-", bu = [], Wv = "arbitrary..", Vv = (e) => {
  const t = Bv(e), {
    conflictingClassGroups: n,
    conflictingClassGroupModifiers: r
  } = e;
  return {
    getClassGroupId: (i) => {
      if (i.startsWith("[") && i.endsWith("]"))
        return Uv(i);
      const s = i.split(ol), a = s[0] === "" && s.length > 1 ? 1 : 0;
      return Sf(s, a, t);
    },
    getConflictingClassGroupIds: (i, s) => {
      if (s) {
        const a = r[i], u = n[i];
        return a ? u ? Fv(u, a) : a : u || bu;
      }
      return n[i] || bu;
    }
  };
}, Sf = (e, t, n) => {
  if (e.length - t === 0)
    return n.classGroupId;
  const o = e[t], l = n.nextPart.get(o);
  if (l) {
    const u = Sf(e, t + 1, l);
    if (u)
      return u;
  }
  const i = n.validators;
  if (i === null)
    return;
  const s = t === 0 ? e.join(ol) : e.slice(t).join(ol), a = i.length;
  for (let u = 0; u < a; u++) {
    const f = i[u];
    if (f.validator(s))
      return f.classGroupId;
  }
}, Uv = (e) => e.slice(1, -1).indexOf(":") === -1 ? void 0 : (() => {
  const t = e.slice(1, -1), n = t.indexOf(":"), r = t.slice(0, n);
  return r ? Wv + r : void 0;
})(), Bv = (e) => {
  const {
    theme: t,
    classGroups: n
  } = e;
  return Hv(n, t);
}, Hv = (e, t) => {
  const n = wf();
  for (const r in e) {
    const o = e[r];
    ua(o, n, r, t);
  }
  return n;
}, ua = (e, t, n, r) => {
  const o = e.length;
  for (let l = 0; l < o; l++) {
    const i = e[l];
    Qv(i, t, n, r);
  }
}, Qv = (e, t, n, r) => {
  if (typeof e == "string") {
    Yv(e, t, n);
    return;
  }
  if (typeof e == "function") {
    Gv(e, t, n, r);
    return;
  }
  Kv(e, t, n, r);
}, Yv = (e, t, n) => {
  const r = e === "" ? t : xf(t, e);
  r.classGroupId = n;
}, Gv = (e, t, n, r) => {
  if (Xv(e)) {
    ua(e(r), t, n, r);
    return;
  }
  t.validators === null && (t.validators = []), t.validators.push($v(n, e));
}, Kv = (e, t, n, r) => {
  const o = Object.entries(e), l = o.length;
  for (let i = 0; i < l; i++) {
    const [s, a] = o[i];
    ua(a, xf(t, s), n, r);
  }
}, xf = (e, t) => {
  let n = e;
  const r = t.split(ol), o = r.length;
  for (let l = 0; l < o; l++) {
    const i = r[l];
    let s = n.nextPart.get(i);
    s || (s = wf(), n.nextPart.set(i, s)), n = s;
  }
  return n;
}, Xv = (e) => "isThemeGetter" in e && e.isThemeGetter === !0, Zv = (e) => {
  if (e < 1)
    return {
      get: () => {
      },
      set: () => {
      }
    };
  let t = 0, n = /* @__PURE__ */ Object.create(null), r = /* @__PURE__ */ Object.create(null);
  const o = (l, i) => {
    n[l] = i, t++, t > e && (t = 0, r = n, n = /* @__PURE__ */ Object.create(null));
  };
  return {
    get(l) {
      let i = n[l];
      if (i !== void 0)
        return i;
      if ((i = r[l]) !== void 0)
        return o(l, i), i;
    },
    set(l, i) {
      l in n ? n[l] = i : o(l, i);
    }
  };
}, us = "!", Iu = ":", Jv = [], Lu = (e, t, n, r, o) => ({
  modifiers: e,
  hasImportantModifier: t,
  baseClassName: n,
  maybePostfixModifierPosition: r,
  isExternal: o
}), qv = (e) => {
  const {
    prefix: t,
    experimentalParseClassName: n
  } = e;
  let r = (o) => {
    const l = [];
    let i = 0, s = 0, a = 0, u;
    const f = o.length;
    for (let y = 0; y < f; y++) {
      const E = o[y];
      if (i === 0 && s === 0) {
        if (E === Iu) {
          l.push(o.slice(a, y)), a = y + 1;
          continue;
        }
        if (E === "/") {
          u = y;
          continue;
        }
      }
      E === "[" ? i++ : E === "]" ? i-- : E === "(" ? s++ : E === ")" && s--;
    }
    const m = l.length === 0 ? o : o.slice(a);
    let p = m, w = !1;
    m.endsWith(us) ? (p = m.slice(0, -1), w = !0) : (
      /**
       * In Tailwind CSS v3 the important modifier was at the start of the base class name. This is still supported for legacy reasons.
       * @see https://github.com/dcastil/tailwind-merge/issues/513#issuecomment-2614029864
       */
      m.startsWith(us) && (p = m.slice(1), w = !0)
    );
    const x = u && u > a ? u - a : void 0;
    return Lu(l, w, p, x);
  };
  if (t) {
    const o = t + Iu, l = r;
    r = (i) => i.startsWith(o) ? l(i.slice(o.length)) : Lu(Jv, !1, i, void 0, !0);
  }
  if (n) {
    const o = r;
    r = (l) => n({
      className: l,
      parseClassName: o
    });
  }
  return r;
}, eg = (e) => {
  const t = /* @__PURE__ */ new Map();
  return e.orderSensitiveModifiers.forEach((n, r) => {
    t.set(n, 1e6 + r);
  }), (n) => {
    const r = [];
    let o = [];
    for (let l = 0; l < n.length; l++) {
      const i = n[l], s = i[0] === "[", a = t.has(i);
      s || a ? (o.length > 0 && (o.sort(), r.push(...o), o = []), r.push(i)) : o.push(i);
    }
    return o.length > 0 && (o.sort(), r.push(...o)), r;
  };
}, tg = (e) => ({
  cache: Zv(e.cacheSize),
  parseClassName: qv(e),
  sortModifiers: eg(e),
  ...Vv(e)
}), ng = /\s+/, rg = (e, t) => {
  const {
    parseClassName: n,
    getClassGroupId: r,
    getConflictingClassGroupIds: o,
    sortModifiers: l
  } = t, i = [], s = e.trim().split(ng);
  let a = "";
  for (let u = s.length - 1; u >= 0; u -= 1) {
    const f = s[u], {
      isExternal: m,
      modifiers: p,
      hasImportantModifier: w,
      baseClassName: x,
      maybePostfixModifierPosition: y
    } = n(f);
    if (m) {
      a = f + (a.length > 0 ? " " + a : a);
      continue;
    }
    let E = !!y, h = r(E ? x.substring(0, y) : x);
    if (!h) {
      if (!E) {
        a = f + (a.length > 0 ? " " + a : a);
        continue;
      }
      if (h = r(x), !h) {
        a = f + (a.length > 0 ? " " + a : a);
        continue;
      }
      E = !1;
    }
    const d = p.length === 0 ? "" : p.length === 1 ? p[0] : l(p).join(":"), v = w ? d + us : d, S = v + h;
    if (i.indexOf(S) > -1)
      continue;
    i.push(S);
    const P = o(h, E);
    for (let R = 0; R < P.length; ++R) {
      const N = P[R];
      i.push(v + N);
    }
    a = f + (a.length > 0 ? " " + a : a);
  }
  return a;
}, og = (...e) => {
  let t = 0, n, r, o = "";
  for (; t < e.length; )
    (n = e[t++]) && (r = kf(n)) && (o && (o += " "), o += r);
  return o;
}, kf = (e) => {
  if (typeof e == "string")
    return e;
  let t, n = "";
  for (let r = 0; r < e.length; r++)
    e[r] && (t = kf(e[r])) && (n && (n += " "), n += t);
  return n;
}, lg = (e, ...t) => {
  let n, r, o, l;
  const i = (a) => {
    const u = t.reduce((f, m) => m(f), e());
    return n = tg(u), r = n.cache.get, o = n.cache.set, l = s, s(a);
  }, s = (a) => {
    const u = r(a);
    if (u)
      return u;
    const f = rg(a, n);
    return o(a, f), f;
  };
  return l = i, (...a) => l(og(...a));
}, ig = [], le = (e) => {
  const t = (n) => n[e] || ig;
  return t.isThemeGetter = !0, t;
}, Cf = /^\[(?:(\w[\w-]*):)?(.+)\]$/i, Ef = /^\((?:(\w[\w-]*):)?(.+)\)$/i, sg = /^\d+\/\d+$/, ag = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/, ug = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/, cg = /^(rgba?|hsla?|hwb|(ok)?(lab|lch)|color-mix)\(.+\)$/, dg = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/, fg = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/, fn = (e) => sg.test(e), D = (e) => !!e && !Number.isNaN(Number(e)), Et = (e) => !!e && Number.isInteger(Number(e)), si = (e) => e.endsWith("%") && D(e.slice(0, -1)), at = (e) => ag.test(e), pg = () => !0, mg = (e) => (
  // `colorFunctionRegex` check is necessary because color functions can have percentages in them which which would be incorrectly classified as lengths.
  // For example, `hsl(0 0% 0%)` would be classified as a length without this check.
  // I could also use lookbehind assertion in `lengthUnitRegex` but that isn't supported widely enough.
  ug.test(e) && !cg.test(e)
), Pf = () => !1, hg = (e) => dg.test(e), vg = (e) => fg.test(e), gg = (e) => !A(e) && !j(e), yg = (e) => Qn(e, Rf, Pf), A = (e) => Cf.test(e), Qt = (e) => Qn(e, Tf, mg), ai = (e) => Qn(e, Cg, D), Du = (e) => Qn(e, Nf, Pf), wg = (e) => Qn(e, _f, vg), po = (e) => Qn(e, Af, hg), j = (e) => Ef.test(e), rr = (e) => Yn(e, Tf), Sg = (e) => Yn(e, Eg), zu = (e) => Yn(e, Nf), xg = (e) => Yn(e, Rf), kg = (e) => Yn(e, _f), mo = (e) => Yn(e, Af, !0), Qn = (e, t, n) => {
  const r = Cf.exec(e);
  return r ? r[1] ? t(r[1]) : n(r[2]) : !1;
}, Yn = (e, t, n = !1) => {
  const r = Ef.exec(e);
  return r ? r[1] ? t(r[1]) : n : !1;
}, Nf = (e) => e === "position" || e === "percentage", _f = (e) => e === "image" || e === "url", Rf = (e) => e === "length" || e === "size" || e === "bg-size", Tf = (e) => e === "length", Cg = (e) => e === "number", Eg = (e) => e === "family-name", Af = (e) => e === "shadow", Pg = () => {
  const e = le("color"), t = le("font"), n = le("text"), r = le("font-weight"), o = le("tracking"), l = le("leading"), i = le("breakpoint"), s = le("container"), a = le("spacing"), u = le("radius"), f = le("shadow"), m = le("inset-shadow"), p = le("text-shadow"), w = le("drop-shadow"), x = le("blur"), y = le("perspective"), E = le("aspect"), h = le("ease"), d = le("animate"), v = () => ["auto", "avoid", "all", "avoid-page", "page", "left", "right", "column"], S = () => [
    "center",
    "top",
    "bottom",
    "left",
    "right",
    "top-left",
    // Deprecated since Tailwind CSS v4.1.0, see https://github.com/tailwindlabs/tailwindcss/pull/17378
    "left-top",
    "top-right",
    // Deprecated since Tailwind CSS v4.1.0, see https://github.com/tailwindlabs/tailwindcss/pull/17378
    "right-top",
    "bottom-right",
    // Deprecated since Tailwind CSS v4.1.0, see https://github.com/tailwindlabs/tailwindcss/pull/17378
    "right-bottom",
    "bottom-left",
    // Deprecated since Tailwind CSS v4.1.0, see https://github.com/tailwindlabs/tailwindcss/pull/17378
    "left-bottom"
  ], P = () => [...S(), j, A], R = () => ["auto", "hidden", "clip", "visible", "scroll"], N = () => ["auto", "contain", "none"], k = () => [j, A, a], O = () => [fn, "full", "auto", ...k()], b = () => [Et, "none", "subgrid", j, A], $ = () => ["auto", {
    span: ["full", Et, j, A]
  }, Et, j, A], Ce = () => [Et, "auto", j, A], St = () => ["auto", "min", "max", "fr", j, A], cn = () => ["start", "end", "center", "between", "around", "evenly", "stretch", "baseline", "center-safe", "end-safe"], xt = () => ["start", "end", "center", "stretch", "center-safe", "end-safe"], Te = () => ["auto", ...k()], Be = () => [fn, "auto", "full", "dvw", "dvh", "lvw", "lvh", "svw", "svh", "min", "max", "fit", ...k()], C = () => [e, j, A], I = () => [...S(), zu, Du, {
    position: [j, A]
  }], L = () => ["no-repeat", {
    repeat: ["", "x", "y", "space", "round"]
  }], B = () => ["auto", "cover", "contain", xg, yg, {
    size: [j, A]
  }], X = () => [si, rr, Qt], ne = () => [
    // Deprecated since Tailwind CSS v4.0.0
    "",
    "none",
    "full",
    u,
    j,
    A
  ], q = () => ["", D, rr, Qt], kt = () => ["solid", "dashed", "dotted", "double"], et = () => ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"], Q = () => [D, si, zu, Du], Ca = () => [
    // Deprecated since Tailwind CSS v4.0.0
    "",
    "none",
    x,
    j,
    A
  ], Qr = () => ["none", D, j, A], Yr = () => ["none", D, j, A], Il = () => [D, j, A], Gr = () => [fn, "full", ...k()];
  return {
    cacheSize: 500,
    theme: {
      animate: ["spin", "ping", "pulse", "bounce"],
      aspect: ["video"],
      blur: [at],
      breakpoint: [at],
      color: [pg],
      container: [at],
      "drop-shadow": [at],
      ease: ["in", "out", "in-out"],
      font: [gg],
      "font-weight": ["thin", "extralight", "light", "normal", "medium", "semibold", "bold", "extrabold", "black"],
      "inset-shadow": [at],
      leading: ["none", "tight", "snug", "normal", "relaxed", "loose"],
      perspective: ["dramatic", "near", "normal", "midrange", "distant", "none"],
      radius: [at],
      shadow: [at],
      spacing: ["px", D],
      text: [at],
      "text-shadow": [at],
      tracking: ["tighter", "tight", "normal", "wide", "wider", "widest"]
    },
    classGroups: {
      // --------------
      // --- Layout ---
      // --------------
      /**
       * Aspect Ratio
       * @see https://tailwindcss.com/docs/aspect-ratio
       */
      aspect: [{
        aspect: ["auto", "square", fn, A, j, E]
      }],
      /**
       * Container
       * @see https://tailwindcss.com/docs/container
       * @deprecated since Tailwind CSS v4.0.0
       */
      container: ["container"],
      /**
       * Columns
       * @see https://tailwindcss.com/docs/columns
       */
      columns: [{
        columns: [D, A, j, s]
      }],
      /**
       * Break After
       * @see https://tailwindcss.com/docs/break-after
       */
      "break-after": [{
        "break-after": v()
      }],
      /**
       * Break Before
       * @see https://tailwindcss.com/docs/break-before
       */
      "break-before": [{
        "break-before": v()
      }],
      /**
       * Break Inside
       * @see https://tailwindcss.com/docs/break-inside
       */
      "break-inside": [{
        "break-inside": ["auto", "avoid", "avoid-page", "avoid-column"]
      }],
      /**
       * Box Decoration Break
       * @see https://tailwindcss.com/docs/box-decoration-break
       */
      "box-decoration": [{
        "box-decoration": ["slice", "clone"]
      }],
      /**
       * Box Sizing
       * @see https://tailwindcss.com/docs/box-sizing
       */
      box: [{
        box: ["border", "content"]
      }],
      /**
       * Display
       * @see https://tailwindcss.com/docs/display
       */
      display: ["block", "inline-block", "inline", "flex", "inline-flex", "table", "inline-table", "table-caption", "table-cell", "table-column", "table-column-group", "table-footer-group", "table-header-group", "table-row-group", "table-row", "flow-root", "grid", "inline-grid", "contents", "list-item", "hidden"],
      /**
       * Screen Reader Only
       * @see https://tailwindcss.com/docs/display#screen-reader-only
       */
      sr: ["sr-only", "not-sr-only"],
      /**
       * Floats
       * @see https://tailwindcss.com/docs/float
       */
      float: [{
        float: ["right", "left", "none", "start", "end"]
      }],
      /**
       * Clear
       * @see https://tailwindcss.com/docs/clear
       */
      clear: [{
        clear: ["left", "right", "both", "none", "start", "end"]
      }],
      /**
       * Isolation
       * @see https://tailwindcss.com/docs/isolation
       */
      isolation: ["isolate", "isolation-auto"],
      /**
       * Object Fit
       * @see https://tailwindcss.com/docs/object-fit
       */
      "object-fit": [{
        object: ["contain", "cover", "fill", "none", "scale-down"]
      }],
      /**
       * Object Position
       * @see https://tailwindcss.com/docs/object-position
       */
      "object-position": [{
        object: P()
      }],
      /**
       * Overflow
       * @see https://tailwindcss.com/docs/overflow
       */
      overflow: [{
        overflow: R()
      }],
      /**
       * Overflow X
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-x": [{
        "overflow-x": R()
      }],
      /**
       * Overflow Y
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-y": [{
        "overflow-y": R()
      }],
      /**
       * Overscroll Behavior
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      overscroll: [{
        overscroll: N()
      }],
      /**
       * Overscroll Behavior X
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-x": [{
        "overscroll-x": N()
      }],
      /**
       * Overscroll Behavior Y
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-y": [{
        "overscroll-y": N()
      }],
      /**
       * Position
       * @see https://tailwindcss.com/docs/position
       */
      position: ["static", "fixed", "absolute", "relative", "sticky"],
      /**
       * Top / Right / Bottom / Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      inset: [{
        inset: O()
      }],
      /**
       * Right / Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-x": [{
        "inset-x": O()
      }],
      /**
       * Top / Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-y": [{
        "inset-y": O()
      }],
      /**
       * Start
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      start: [{
        start: O()
      }],
      /**
       * End
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      end: [{
        end: O()
      }],
      /**
       * Top
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      top: [{
        top: O()
      }],
      /**
       * Right
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      right: [{
        right: O()
      }],
      /**
       * Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      bottom: [{
        bottom: O()
      }],
      /**
       * Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      left: [{
        left: O()
      }],
      /**
       * Visibility
       * @see https://tailwindcss.com/docs/visibility
       */
      visibility: ["visible", "invisible", "collapse"],
      /**
       * Z-Index
       * @see https://tailwindcss.com/docs/z-index
       */
      z: [{
        z: [Et, "auto", j, A]
      }],
      // ------------------------
      // --- Flexbox and Grid ---
      // ------------------------
      /**
       * Flex Basis
       * @see https://tailwindcss.com/docs/flex-basis
       */
      basis: [{
        basis: [fn, "full", "auto", s, ...k()]
      }],
      /**
       * Flex Direction
       * @see https://tailwindcss.com/docs/flex-direction
       */
      "flex-direction": [{
        flex: ["row", "row-reverse", "col", "col-reverse"]
      }],
      /**
       * Flex Wrap
       * @see https://tailwindcss.com/docs/flex-wrap
       */
      "flex-wrap": [{
        flex: ["nowrap", "wrap", "wrap-reverse"]
      }],
      /**
       * Flex
       * @see https://tailwindcss.com/docs/flex
       */
      flex: [{
        flex: [D, fn, "auto", "initial", "none", A]
      }],
      /**
       * Flex Grow
       * @see https://tailwindcss.com/docs/flex-grow
       */
      grow: [{
        grow: ["", D, j, A]
      }],
      /**
       * Flex Shrink
       * @see https://tailwindcss.com/docs/flex-shrink
       */
      shrink: [{
        shrink: ["", D, j, A]
      }],
      /**
       * Order
       * @see https://tailwindcss.com/docs/order
       */
      order: [{
        order: [Et, "first", "last", "none", j, A]
      }],
      /**
       * Grid Template Columns
       * @see https://tailwindcss.com/docs/grid-template-columns
       */
      "grid-cols": [{
        "grid-cols": b()
      }],
      /**
       * Grid Column Start / End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start-end": [{
        col: $()
      }],
      /**
       * Grid Column Start
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start": [{
        "col-start": Ce()
      }],
      /**
       * Grid Column End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-end": [{
        "col-end": Ce()
      }],
      /**
       * Grid Template Rows
       * @see https://tailwindcss.com/docs/grid-template-rows
       */
      "grid-rows": [{
        "grid-rows": b()
      }],
      /**
       * Grid Row Start / End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start-end": [{
        row: $()
      }],
      /**
       * Grid Row Start
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start": [{
        "row-start": Ce()
      }],
      /**
       * Grid Row End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-end": [{
        "row-end": Ce()
      }],
      /**
       * Grid Auto Flow
       * @see https://tailwindcss.com/docs/grid-auto-flow
       */
      "grid-flow": [{
        "grid-flow": ["row", "col", "dense", "row-dense", "col-dense"]
      }],
      /**
       * Grid Auto Columns
       * @see https://tailwindcss.com/docs/grid-auto-columns
       */
      "auto-cols": [{
        "auto-cols": St()
      }],
      /**
       * Grid Auto Rows
       * @see https://tailwindcss.com/docs/grid-auto-rows
       */
      "auto-rows": [{
        "auto-rows": St()
      }],
      /**
       * Gap
       * @see https://tailwindcss.com/docs/gap
       */
      gap: [{
        gap: k()
      }],
      /**
       * Gap X
       * @see https://tailwindcss.com/docs/gap
       */
      "gap-x": [{
        "gap-x": k()
      }],
      /**
       * Gap Y
       * @see https://tailwindcss.com/docs/gap
       */
      "gap-y": [{
        "gap-y": k()
      }],
      /**
       * Justify Content
       * @see https://tailwindcss.com/docs/justify-content
       */
      "justify-content": [{
        justify: [...cn(), "normal"]
      }],
      /**
       * Justify Items
       * @see https://tailwindcss.com/docs/justify-items
       */
      "justify-items": [{
        "justify-items": [...xt(), "normal"]
      }],
      /**
       * Justify Self
       * @see https://tailwindcss.com/docs/justify-self
       */
      "justify-self": [{
        "justify-self": ["auto", ...xt()]
      }],
      /**
       * Align Content
       * @see https://tailwindcss.com/docs/align-content
       */
      "align-content": [{
        content: ["normal", ...cn()]
      }],
      /**
       * Align Items
       * @see https://tailwindcss.com/docs/align-items
       */
      "align-items": [{
        items: [...xt(), {
          baseline: ["", "last"]
        }]
      }],
      /**
       * Align Self
       * @see https://tailwindcss.com/docs/align-self
       */
      "align-self": [{
        self: ["auto", ...xt(), {
          baseline: ["", "last"]
        }]
      }],
      /**
       * Place Content
       * @see https://tailwindcss.com/docs/place-content
       */
      "place-content": [{
        "place-content": cn()
      }],
      /**
       * Place Items
       * @see https://tailwindcss.com/docs/place-items
       */
      "place-items": [{
        "place-items": [...xt(), "baseline"]
      }],
      /**
       * Place Self
       * @see https://tailwindcss.com/docs/place-self
       */
      "place-self": [{
        "place-self": ["auto", ...xt()]
      }],
      // Spacing
      /**
       * Padding
       * @see https://tailwindcss.com/docs/padding
       */
      p: [{
        p: k()
      }],
      /**
       * Padding X
       * @see https://tailwindcss.com/docs/padding
       */
      px: [{
        px: k()
      }],
      /**
       * Padding Y
       * @see https://tailwindcss.com/docs/padding
       */
      py: [{
        py: k()
      }],
      /**
       * Padding Start
       * @see https://tailwindcss.com/docs/padding
       */
      ps: [{
        ps: k()
      }],
      /**
       * Padding End
       * @see https://tailwindcss.com/docs/padding
       */
      pe: [{
        pe: k()
      }],
      /**
       * Padding Top
       * @see https://tailwindcss.com/docs/padding
       */
      pt: [{
        pt: k()
      }],
      /**
       * Padding Right
       * @see https://tailwindcss.com/docs/padding
       */
      pr: [{
        pr: k()
      }],
      /**
       * Padding Bottom
       * @see https://tailwindcss.com/docs/padding
       */
      pb: [{
        pb: k()
      }],
      /**
       * Padding Left
       * @see https://tailwindcss.com/docs/padding
       */
      pl: [{
        pl: k()
      }],
      /**
       * Margin
       * @see https://tailwindcss.com/docs/margin
       */
      m: [{
        m: Te()
      }],
      /**
       * Margin X
       * @see https://tailwindcss.com/docs/margin
       */
      mx: [{
        mx: Te()
      }],
      /**
       * Margin Y
       * @see https://tailwindcss.com/docs/margin
       */
      my: [{
        my: Te()
      }],
      /**
       * Margin Start
       * @see https://tailwindcss.com/docs/margin
       */
      ms: [{
        ms: Te()
      }],
      /**
       * Margin End
       * @see https://tailwindcss.com/docs/margin
       */
      me: [{
        me: Te()
      }],
      /**
       * Margin Top
       * @see https://tailwindcss.com/docs/margin
       */
      mt: [{
        mt: Te()
      }],
      /**
       * Margin Right
       * @see https://tailwindcss.com/docs/margin
       */
      mr: [{
        mr: Te()
      }],
      /**
       * Margin Bottom
       * @see https://tailwindcss.com/docs/margin
       */
      mb: [{
        mb: Te()
      }],
      /**
       * Margin Left
       * @see https://tailwindcss.com/docs/margin
       */
      ml: [{
        ml: Te()
      }],
      /**
       * Space Between X
       * @see https://tailwindcss.com/docs/margin#adding-space-between-children
       */
      "space-x": [{
        "space-x": k()
      }],
      /**
       * Space Between X Reverse
       * @see https://tailwindcss.com/docs/margin#adding-space-between-children
       */
      "space-x-reverse": ["space-x-reverse"],
      /**
       * Space Between Y
       * @see https://tailwindcss.com/docs/margin#adding-space-between-children
       */
      "space-y": [{
        "space-y": k()
      }],
      /**
       * Space Between Y Reverse
       * @see https://tailwindcss.com/docs/margin#adding-space-between-children
       */
      "space-y-reverse": ["space-y-reverse"],
      // --------------
      // --- Sizing ---
      // --------------
      /**
       * Size
       * @see https://tailwindcss.com/docs/width#setting-both-width-and-height
       */
      size: [{
        size: Be()
      }],
      /**
       * Width
       * @see https://tailwindcss.com/docs/width
       */
      w: [{
        w: [s, "screen", ...Be()]
      }],
      /**
       * Min-Width
       * @see https://tailwindcss.com/docs/min-width
       */
      "min-w": [{
        "min-w": [
          s,
          "screen",
          /** Deprecated. @see https://github.com/tailwindlabs/tailwindcss.com/issues/2027#issuecomment-2620152757 */
          "none",
          ...Be()
        ]
      }],
      /**
       * Max-Width
       * @see https://tailwindcss.com/docs/max-width
       */
      "max-w": [{
        "max-w": [
          s,
          "screen",
          "none",
          /** Deprecated since Tailwind CSS v4.0.0. @see https://github.com/tailwindlabs/tailwindcss.com/issues/2027#issuecomment-2620152757 */
          "prose",
          /** Deprecated since Tailwind CSS v4.0.0. @see https://github.com/tailwindlabs/tailwindcss.com/issues/2027#issuecomment-2620152757 */
          {
            screen: [i]
          },
          ...Be()
        ]
      }],
      /**
       * Height
       * @see https://tailwindcss.com/docs/height
       */
      h: [{
        h: ["screen", "lh", ...Be()]
      }],
      /**
       * Min-Height
       * @see https://tailwindcss.com/docs/min-height
       */
      "min-h": [{
        "min-h": ["screen", "lh", "none", ...Be()]
      }],
      /**
       * Max-Height
       * @see https://tailwindcss.com/docs/max-height
       */
      "max-h": [{
        "max-h": ["screen", "lh", ...Be()]
      }],
      // ------------------
      // --- Typography ---
      // ------------------
      /**
       * Font Size
       * @see https://tailwindcss.com/docs/font-size
       */
      "font-size": [{
        text: ["base", n, rr, Qt]
      }],
      /**
       * Font Smoothing
       * @see https://tailwindcss.com/docs/font-smoothing
       */
      "font-smoothing": ["antialiased", "subpixel-antialiased"],
      /**
       * Font Style
       * @see https://tailwindcss.com/docs/font-style
       */
      "font-style": ["italic", "not-italic"],
      /**
       * Font Weight
       * @see https://tailwindcss.com/docs/font-weight
       */
      "font-weight": [{
        font: [r, j, ai]
      }],
      /**
       * Font Stretch
       * @see https://tailwindcss.com/docs/font-stretch
       */
      "font-stretch": [{
        "font-stretch": ["ultra-condensed", "extra-condensed", "condensed", "semi-condensed", "normal", "semi-expanded", "expanded", "extra-expanded", "ultra-expanded", si, A]
      }],
      /**
       * Font Family
       * @see https://tailwindcss.com/docs/font-family
       */
      "font-family": [{
        font: [Sg, A, t]
      }],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-normal": ["normal-nums"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-ordinal": ["ordinal"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-slashed-zero": ["slashed-zero"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-figure": ["lining-nums", "oldstyle-nums"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-spacing": ["proportional-nums", "tabular-nums"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-fraction": ["diagonal-fractions", "stacked-fractions"],
      /**
       * Letter Spacing
       * @see https://tailwindcss.com/docs/letter-spacing
       */
      tracking: [{
        tracking: [o, j, A]
      }],
      /**
       * Line Clamp
       * @see https://tailwindcss.com/docs/line-clamp
       */
      "line-clamp": [{
        "line-clamp": [D, "none", j, ai]
      }],
      /**
       * Line Height
       * @see https://tailwindcss.com/docs/line-height
       */
      leading: [{
        leading: [
          /** Deprecated since Tailwind CSS v4.0.0. @see https://github.com/tailwindlabs/tailwindcss.com/issues/2027#issuecomment-2620152757 */
          l,
          ...k()
        ]
      }],
      /**
       * List Style Image
       * @see https://tailwindcss.com/docs/list-style-image
       */
      "list-image": [{
        "list-image": ["none", j, A]
      }],
      /**
       * List Style Position
       * @see https://tailwindcss.com/docs/list-style-position
       */
      "list-style-position": [{
        list: ["inside", "outside"]
      }],
      /**
       * List Style Type
       * @see https://tailwindcss.com/docs/list-style-type
       */
      "list-style-type": [{
        list: ["disc", "decimal", "none", j, A]
      }],
      /**
       * Text Alignment
       * @see https://tailwindcss.com/docs/text-align
       */
      "text-alignment": [{
        text: ["left", "center", "right", "justify", "start", "end"]
      }],
      /**
       * Placeholder Color
       * @deprecated since Tailwind CSS v3.0.0
       * @see https://v3.tailwindcss.com/docs/placeholder-color
       */
      "placeholder-color": [{
        placeholder: C()
      }],
      /**
       * Text Color
       * @see https://tailwindcss.com/docs/text-color
       */
      "text-color": [{
        text: C()
      }],
      /**
       * Text Decoration
       * @see https://tailwindcss.com/docs/text-decoration
       */
      "text-decoration": ["underline", "overline", "line-through", "no-underline"],
      /**
       * Text Decoration Style
       * @see https://tailwindcss.com/docs/text-decoration-style
       */
      "text-decoration-style": [{
        decoration: [...kt(), "wavy"]
      }],
      /**
       * Text Decoration Thickness
       * @see https://tailwindcss.com/docs/text-decoration-thickness
       */
      "text-decoration-thickness": [{
        decoration: [D, "from-font", "auto", j, Qt]
      }],
      /**
       * Text Decoration Color
       * @see https://tailwindcss.com/docs/text-decoration-color
       */
      "text-decoration-color": [{
        decoration: C()
      }],
      /**
       * Text Underline Offset
       * @see https://tailwindcss.com/docs/text-underline-offset
       */
      "underline-offset": [{
        "underline-offset": [D, "auto", j, A]
      }],
      /**
       * Text Transform
       * @see https://tailwindcss.com/docs/text-transform
       */
      "text-transform": ["uppercase", "lowercase", "capitalize", "normal-case"],
      /**
       * Text Overflow
       * @see https://tailwindcss.com/docs/text-overflow
       */
      "text-overflow": ["truncate", "text-ellipsis", "text-clip"],
      /**
       * Text Wrap
       * @see https://tailwindcss.com/docs/text-wrap
       */
      "text-wrap": [{
        text: ["wrap", "nowrap", "balance", "pretty"]
      }],
      /**
       * Text Indent
       * @see https://tailwindcss.com/docs/text-indent
       */
      indent: [{
        indent: k()
      }],
      /**
       * Vertical Alignment
       * @see https://tailwindcss.com/docs/vertical-align
       */
      "vertical-align": [{
        align: ["baseline", "top", "middle", "bottom", "text-top", "text-bottom", "sub", "super", j, A]
      }],
      /**
       * Whitespace
       * @see https://tailwindcss.com/docs/whitespace
       */
      whitespace: [{
        whitespace: ["normal", "nowrap", "pre", "pre-line", "pre-wrap", "break-spaces"]
      }],
      /**
       * Word Break
       * @see https://tailwindcss.com/docs/word-break
       */
      break: [{
        break: ["normal", "words", "all", "keep"]
      }],
      /**
       * Overflow Wrap
       * @see https://tailwindcss.com/docs/overflow-wrap
       */
      wrap: [{
        wrap: ["break-word", "anywhere", "normal"]
      }],
      /**
       * Hyphens
       * @see https://tailwindcss.com/docs/hyphens
       */
      hyphens: [{
        hyphens: ["none", "manual", "auto"]
      }],
      /**
       * Content
       * @see https://tailwindcss.com/docs/content
       */
      content: [{
        content: ["none", j, A]
      }],
      // -------------------
      // --- Backgrounds ---
      // -------------------
      /**
       * Background Attachment
       * @see https://tailwindcss.com/docs/background-attachment
       */
      "bg-attachment": [{
        bg: ["fixed", "local", "scroll"]
      }],
      /**
       * Background Clip
       * @see https://tailwindcss.com/docs/background-clip
       */
      "bg-clip": [{
        "bg-clip": ["border", "padding", "content", "text"]
      }],
      /**
       * Background Origin
       * @see https://tailwindcss.com/docs/background-origin
       */
      "bg-origin": [{
        "bg-origin": ["border", "padding", "content"]
      }],
      /**
       * Background Position
       * @see https://tailwindcss.com/docs/background-position
       */
      "bg-position": [{
        bg: I()
      }],
      /**
       * Background Repeat
       * @see https://tailwindcss.com/docs/background-repeat
       */
      "bg-repeat": [{
        bg: L()
      }],
      /**
       * Background Size
       * @see https://tailwindcss.com/docs/background-size
       */
      "bg-size": [{
        bg: B()
      }],
      /**
       * Background Image
       * @see https://tailwindcss.com/docs/background-image
       */
      "bg-image": [{
        bg: ["none", {
          linear: [{
            to: ["t", "tr", "r", "br", "b", "bl", "l", "tl"]
          }, Et, j, A],
          radial: ["", j, A],
          conic: [Et, j, A]
        }, kg, wg]
      }],
      /**
       * Background Color
       * @see https://tailwindcss.com/docs/background-color
       */
      "bg-color": [{
        bg: C()
      }],
      /**
       * Gradient Color Stops From Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-from-pos": [{
        from: X()
      }],
      /**
       * Gradient Color Stops Via Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via-pos": [{
        via: X()
      }],
      /**
       * Gradient Color Stops To Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to-pos": [{
        to: X()
      }],
      /**
       * Gradient Color Stops From
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-from": [{
        from: C()
      }],
      /**
       * Gradient Color Stops Via
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via": [{
        via: C()
      }],
      /**
       * Gradient Color Stops To
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to": [{
        to: C()
      }],
      // ---------------
      // --- Borders ---
      // ---------------
      /**
       * Border Radius
       * @see https://tailwindcss.com/docs/border-radius
       */
      rounded: [{
        rounded: ne()
      }],
      /**
       * Border Radius Start
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-s": [{
        "rounded-s": ne()
      }],
      /**
       * Border Radius End
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-e": [{
        "rounded-e": ne()
      }],
      /**
       * Border Radius Top
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-t": [{
        "rounded-t": ne()
      }],
      /**
       * Border Radius Right
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-r": [{
        "rounded-r": ne()
      }],
      /**
       * Border Radius Bottom
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-b": [{
        "rounded-b": ne()
      }],
      /**
       * Border Radius Left
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-l": [{
        "rounded-l": ne()
      }],
      /**
       * Border Radius Start Start
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-ss": [{
        "rounded-ss": ne()
      }],
      /**
       * Border Radius Start End
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-se": [{
        "rounded-se": ne()
      }],
      /**
       * Border Radius End End
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-ee": [{
        "rounded-ee": ne()
      }],
      /**
       * Border Radius End Start
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-es": [{
        "rounded-es": ne()
      }],
      /**
       * Border Radius Top Left
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-tl": [{
        "rounded-tl": ne()
      }],
      /**
       * Border Radius Top Right
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-tr": [{
        "rounded-tr": ne()
      }],
      /**
       * Border Radius Bottom Right
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-br": [{
        "rounded-br": ne()
      }],
      /**
       * Border Radius Bottom Left
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-bl": [{
        "rounded-bl": ne()
      }],
      /**
       * Border Width
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w": [{
        border: q()
      }],
      /**
       * Border Width X
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-x": [{
        "border-x": q()
      }],
      /**
       * Border Width Y
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-y": [{
        "border-y": q()
      }],
      /**
       * Border Width Start
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-s": [{
        "border-s": q()
      }],
      /**
       * Border Width End
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-e": [{
        "border-e": q()
      }],
      /**
       * Border Width Top
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-t": [{
        "border-t": q()
      }],
      /**
       * Border Width Right
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-r": [{
        "border-r": q()
      }],
      /**
       * Border Width Bottom
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-b": [{
        "border-b": q()
      }],
      /**
       * Border Width Left
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-l": [{
        "border-l": q()
      }],
      /**
       * Divide Width X
       * @see https://tailwindcss.com/docs/border-width#between-children
       */
      "divide-x": [{
        "divide-x": q()
      }],
      /**
       * Divide Width X Reverse
       * @see https://tailwindcss.com/docs/border-width#between-children
       */
      "divide-x-reverse": ["divide-x-reverse"],
      /**
       * Divide Width Y
       * @see https://tailwindcss.com/docs/border-width#between-children
       */
      "divide-y": [{
        "divide-y": q()
      }],
      /**
       * Divide Width Y Reverse
       * @see https://tailwindcss.com/docs/border-width#between-children
       */
      "divide-y-reverse": ["divide-y-reverse"],
      /**
       * Border Style
       * @see https://tailwindcss.com/docs/border-style
       */
      "border-style": [{
        border: [...kt(), "hidden", "none"]
      }],
      /**
       * Divide Style
       * @see https://tailwindcss.com/docs/border-style#setting-the-divider-style
       */
      "divide-style": [{
        divide: [...kt(), "hidden", "none"]
      }],
      /**
       * Border Color
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color": [{
        border: C()
      }],
      /**
       * Border Color X
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-x": [{
        "border-x": C()
      }],
      /**
       * Border Color Y
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-y": [{
        "border-y": C()
      }],
      /**
       * Border Color S
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-s": [{
        "border-s": C()
      }],
      /**
       * Border Color E
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-e": [{
        "border-e": C()
      }],
      /**
       * Border Color Top
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-t": [{
        "border-t": C()
      }],
      /**
       * Border Color Right
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-r": [{
        "border-r": C()
      }],
      /**
       * Border Color Bottom
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-b": [{
        "border-b": C()
      }],
      /**
       * Border Color Left
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-l": [{
        "border-l": C()
      }],
      /**
       * Divide Color
       * @see https://tailwindcss.com/docs/divide-color
       */
      "divide-color": [{
        divide: C()
      }],
      /**
       * Outline Style
       * @see https://tailwindcss.com/docs/outline-style
       */
      "outline-style": [{
        outline: [...kt(), "none", "hidden"]
      }],
      /**
       * Outline Offset
       * @see https://tailwindcss.com/docs/outline-offset
       */
      "outline-offset": [{
        "outline-offset": [D, j, A]
      }],
      /**
       * Outline Width
       * @see https://tailwindcss.com/docs/outline-width
       */
      "outline-w": [{
        outline: ["", D, rr, Qt]
      }],
      /**
       * Outline Color
       * @see https://tailwindcss.com/docs/outline-color
       */
      "outline-color": [{
        outline: C()
      }],
      // ---------------
      // --- Effects ---
      // ---------------
      /**
       * Box Shadow
       * @see https://tailwindcss.com/docs/box-shadow
       */
      shadow: [{
        shadow: [
          // Deprecated since Tailwind CSS v4.0.0
          "",
          "none",
          f,
          mo,
          po
        ]
      }],
      /**
       * Box Shadow Color
       * @see https://tailwindcss.com/docs/box-shadow#setting-the-shadow-color
       */
      "shadow-color": [{
        shadow: C()
      }],
      /**
       * Inset Box Shadow
       * @see https://tailwindcss.com/docs/box-shadow#adding-an-inset-shadow
       */
      "inset-shadow": [{
        "inset-shadow": ["none", m, mo, po]
      }],
      /**
       * Inset Box Shadow Color
       * @see https://tailwindcss.com/docs/box-shadow#setting-the-inset-shadow-color
       */
      "inset-shadow-color": [{
        "inset-shadow": C()
      }],
      /**
       * Ring Width
       * @see https://tailwindcss.com/docs/box-shadow#adding-a-ring
       */
      "ring-w": [{
        ring: q()
      }],
      /**
       * Ring Width Inset
       * @see https://v3.tailwindcss.com/docs/ring-width#inset-rings
       * @deprecated since Tailwind CSS v4.0.0
       * @see https://github.com/tailwindlabs/tailwindcss/blob/v4.0.0/packages/tailwindcss/src/utilities.ts#L4158
       */
      "ring-w-inset": ["ring-inset"],
      /**
       * Ring Color
       * @see https://tailwindcss.com/docs/box-shadow#setting-the-ring-color
       */
      "ring-color": [{
        ring: C()
      }],
      /**
       * Ring Offset Width
       * @see https://v3.tailwindcss.com/docs/ring-offset-width
       * @deprecated since Tailwind CSS v4.0.0
       * @see https://github.com/tailwindlabs/tailwindcss/blob/v4.0.0/packages/tailwindcss/src/utilities.ts#L4158
       */
      "ring-offset-w": [{
        "ring-offset": [D, Qt]
      }],
      /**
       * Ring Offset Color
       * @see https://v3.tailwindcss.com/docs/ring-offset-color
       * @deprecated since Tailwind CSS v4.0.0
       * @see https://github.com/tailwindlabs/tailwindcss/blob/v4.0.0/packages/tailwindcss/src/utilities.ts#L4158
       */
      "ring-offset-color": [{
        "ring-offset": C()
      }],
      /**
       * Inset Ring Width
       * @see https://tailwindcss.com/docs/box-shadow#adding-an-inset-ring
       */
      "inset-ring-w": [{
        "inset-ring": q()
      }],
      /**
       * Inset Ring Color
       * @see https://tailwindcss.com/docs/box-shadow#setting-the-inset-ring-color
       */
      "inset-ring-color": [{
        "inset-ring": C()
      }],
      /**
       * Text Shadow
       * @see https://tailwindcss.com/docs/text-shadow
       */
      "text-shadow": [{
        "text-shadow": ["none", p, mo, po]
      }],
      /**
       * Text Shadow Color
       * @see https://tailwindcss.com/docs/text-shadow#setting-the-shadow-color
       */
      "text-shadow-color": [{
        "text-shadow": C()
      }],
      /**
       * Opacity
       * @see https://tailwindcss.com/docs/opacity
       */
      opacity: [{
        opacity: [D, j, A]
      }],
      /**
       * Mix Blend Mode
       * @see https://tailwindcss.com/docs/mix-blend-mode
       */
      "mix-blend": [{
        "mix-blend": [...et(), "plus-darker", "plus-lighter"]
      }],
      /**
       * Background Blend Mode
       * @see https://tailwindcss.com/docs/background-blend-mode
       */
      "bg-blend": [{
        "bg-blend": et()
      }],
      /**
       * Mask Clip
       * @see https://tailwindcss.com/docs/mask-clip
       */
      "mask-clip": [{
        "mask-clip": ["border", "padding", "content", "fill", "stroke", "view"]
      }, "mask-no-clip"],
      /**
       * Mask Composite
       * @see https://tailwindcss.com/docs/mask-composite
       */
      "mask-composite": [{
        mask: ["add", "subtract", "intersect", "exclude"]
      }],
      /**
       * Mask Image
       * @see https://tailwindcss.com/docs/mask-image
       */
      "mask-image-linear-pos": [{
        "mask-linear": [D]
      }],
      "mask-image-linear-from-pos": [{
        "mask-linear-from": Q()
      }],
      "mask-image-linear-to-pos": [{
        "mask-linear-to": Q()
      }],
      "mask-image-linear-from-color": [{
        "mask-linear-from": C()
      }],
      "mask-image-linear-to-color": [{
        "mask-linear-to": C()
      }],
      "mask-image-t-from-pos": [{
        "mask-t-from": Q()
      }],
      "mask-image-t-to-pos": [{
        "mask-t-to": Q()
      }],
      "mask-image-t-from-color": [{
        "mask-t-from": C()
      }],
      "mask-image-t-to-color": [{
        "mask-t-to": C()
      }],
      "mask-image-r-from-pos": [{
        "mask-r-from": Q()
      }],
      "mask-image-r-to-pos": [{
        "mask-r-to": Q()
      }],
      "mask-image-r-from-color": [{
        "mask-r-from": C()
      }],
      "mask-image-r-to-color": [{
        "mask-r-to": C()
      }],
      "mask-image-b-from-pos": [{
        "mask-b-from": Q()
      }],
      "mask-image-b-to-pos": [{
        "mask-b-to": Q()
      }],
      "mask-image-b-from-color": [{
        "mask-b-from": C()
      }],
      "mask-image-b-to-color": [{
        "mask-b-to": C()
      }],
      "mask-image-l-from-pos": [{
        "mask-l-from": Q()
      }],
      "mask-image-l-to-pos": [{
        "mask-l-to": Q()
      }],
      "mask-image-l-from-color": [{
        "mask-l-from": C()
      }],
      "mask-image-l-to-color": [{
        "mask-l-to": C()
      }],
      "mask-image-x-from-pos": [{
        "mask-x-from": Q()
      }],
      "mask-image-x-to-pos": [{
        "mask-x-to": Q()
      }],
      "mask-image-x-from-color": [{
        "mask-x-from": C()
      }],
      "mask-image-x-to-color": [{
        "mask-x-to": C()
      }],
      "mask-image-y-from-pos": [{
        "mask-y-from": Q()
      }],
      "mask-image-y-to-pos": [{
        "mask-y-to": Q()
      }],
      "mask-image-y-from-color": [{
        "mask-y-from": C()
      }],
      "mask-image-y-to-color": [{
        "mask-y-to": C()
      }],
      "mask-image-radial": [{
        "mask-radial": [j, A]
      }],
      "mask-image-radial-from-pos": [{
        "mask-radial-from": Q()
      }],
      "mask-image-radial-to-pos": [{
        "mask-radial-to": Q()
      }],
      "mask-image-radial-from-color": [{
        "mask-radial-from": C()
      }],
      "mask-image-radial-to-color": [{
        "mask-radial-to": C()
      }],
      "mask-image-radial-shape": [{
        "mask-radial": ["circle", "ellipse"]
      }],
      "mask-image-radial-size": [{
        "mask-radial": [{
          closest: ["side", "corner"],
          farthest: ["side", "corner"]
        }]
      }],
      "mask-image-radial-pos": [{
        "mask-radial-at": S()
      }],
      "mask-image-conic-pos": [{
        "mask-conic": [D]
      }],
      "mask-image-conic-from-pos": [{
        "mask-conic-from": Q()
      }],
      "mask-image-conic-to-pos": [{
        "mask-conic-to": Q()
      }],
      "mask-image-conic-from-color": [{
        "mask-conic-from": C()
      }],
      "mask-image-conic-to-color": [{
        "mask-conic-to": C()
      }],
      /**
       * Mask Mode
       * @see https://tailwindcss.com/docs/mask-mode
       */
      "mask-mode": [{
        mask: ["alpha", "luminance", "match"]
      }],
      /**
       * Mask Origin
       * @see https://tailwindcss.com/docs/mask-origin
       */
      "mask-origin": [{
        "mask-origin": ["border", "padding", "content", "fill", "stroke", "view"]
      }],
      /**
       * Mask Position
       * @see https://tailwindcss.com/docs/mask-position
       */
      "mask-position": [{
        mask: I()
      }],
      /**
       * Mask Repeat
       * @see https://tailwindcss.com/docs/mask-repeat
       */
      "mask-repeat": [{
        mask: L()
      }],
      /**
       * Mask Size
       * @see https://tailwindcss.com/docs/mask-size
       */
      "mask-size": [{
        mask: B()
      }],
      /**
       * Mask Type
       * @see https://tailwindcss.com/docs/mask-type
       */
      "mask-type": [{
        "mask-type": ["alpha", "luminance"]
      }],
      /**
       * Mask Image
       * @see https://tailwindcss.com/docs/mask-image
       */
      "mask-image": [{
        mask: ["none", j, A]
      }],
      // ---------------
      // --- Filters ---
      // ---------------
      /**
       * Filter
       * @see https://tailwindcss.com/docs/filter
       */
      filter: [{
        filter: [
          // Deprecated since Tailwind CSS v3.0.0
          "",
          "none",
          j,
          A
        ]
      }],
      /**
       * Blur
       * @see https://tailwindcss.com/docs/blur
       */
      blur: [{
        blur: Ca()
      }],
      /**
       * Brightness
       * @see https://tailwindcss.com/docs/brightness
       */
      brightness: [{
        brightness: [D, j, A]
      }],
      /**
       * Contrast
       * @see https://tailwindcss.com/docs/contrast
       */
      contrast: [{
        contrast: [D, j, A]
      }],
      /**
       * Drop Shadow
       * @see https://tailwindcss.com/docs/drop-shadow
       */
      "drop-shadow": [{
        "drop-shadow": [
          // Deprecated since Tailwind CSS v4.0.0
          "",
          "none",
          w,
          mo,
          po
        ]
      }],
      /**
       * Drop Shadow Color
       * @see https://tailwindcss.com/docs/filter-drop-shadow#setting-the-shadow-color
       */
      "drop-shadow-color": [{
        "drop-shadow": C()
      }],
      /**
       * Grayscale
       * @see https://tailwindcss.com/docs/grayscale
       */
      grayscale: [{
        grayscale: ["", D, j, A]
      }],
      /**
       * Hue Rotate
       * @see https://tailwindcss.com/docs/hue-rotate
       */
      "hue-rotate": [{
        "hue-rotate": [D, j, A]
      }],
      /**
       * Invert
       * @see https://tailwindcss.com/docs/invert
       */
      invert: [{
        invert: ["", D, j, A]
      }],
      /**
       * Saturate
       * @see https://tailwindcss.com/docs/saturate
       */
      saturate: [{
        saturate: [D, j, A]
      }],
      /**
       * Sepia
       * @see https://tailwindcss.com/docs/sepia
       */
      sepia: [{
        sepia: ["", D, j, A]
      }],
      /**
       * Backdrop Filter
       * @see https://tailwindcss.com/docs/backdrop-filter
       */
      "backdrop-filter": [{
        "backdrop-filter": [
          // Deprecated since Tailwind CSS v3.0.0
          "",
          "none",
          j,
          A
        ]
      }],
      /**
       * Backdrop Blur
       * @see https://tailwindcss.com/docs/backdrop-blur
       */
      "backdrop-blur": [{
        "backdrop-blur": Ca()
      }],
      /**
       * Backdrop Brightness
       * @see https://tailwindcss.com/docs/backdrop-brightness
       */
      "backdrop-brightness": [{
        "backdrop-brightness": [D, j, A]
      }],
      /**
       * Backdrop Contrast
       * @see https://tailwindcss.com/docs/backdrop-contrast
       */
      "backdrop-contrast": [{
        "backdrop-contrast": [D, j, A]
      }],
      /**
       * Backdrop Grayscale
       * @see https://tailwindcss.com/docs/backdrop-grayscale
       */
      "backdrop-grayscale": [{
        "backdrop-grayscale": ["", D, j, A]
      }],
      /**
       * Backdrop Hue Rotate
       * @see https://tailwindcss.com/docs/backdrop-hue-rotate
       */
      "backdrop-hue-rotate": [{
        "backdrop-hue-rotate": [D, j, A]
      }],
      /**
       * Backdrop Invert
       * @see https://tailwindcss.com/docs/backdrop-invert
       */
      "backdrop-invert": [{
        "backdrop-invert": ["", D, j, A]
      }],
      /**
       * Backdrop Opacity
       * @see https://tailwindcss.com/docs/backdrop-opacity
       */
      "backdrop-opacity": [{
        "backdrop-opacity": [D, j, A]
      }],
      /**
       * Backdrop Saturate
       * @see https://tailwindcss.com/docs/backdrop-saturate
       */
      "backdrop-saturate": [{
        "backdrop-saturate": [D, j, A]
      }],
      /**
       * Backdrop Sepia
       * @see https://tailwindcss.com/docs/backdrop-sepia
       */
      "backdrop-sepia": [{
        "backdrop-sepia": ["", D, j, A]
      }],
      // --------------
      // --- Tables ---
      // --------------
      /**
       * Border Collapse
       * @see https://tailwindcss.com/docs/border-collapse
       */
      "border-collapse": [{
        border: ["collapse", "separate"]
      }],
      /**
       * Border Spacing
       * @see https://tailwindcss.com/docs/border-spacing
       */
      "border-spacing": [{
        "border-spacing": k()
      }],
      /**
       * Border Spacing X
       * @see https://tailwindcss.com/docs/border-spacing
       */
      "border-spacing-x": [{
        "border-spacing-x": k()
      }],
      /**
       * Border Spacing Y
       * @see https://tailwindcss.com/docs/border-spacing
       */
      "border-spacing-y": [{
        "border-spacing-y": k()
      }],
      /**
       * Table Layout
       * @see https://tailwindcss.com/docs/table-layout
       */
      "table-layout": [{
        table: ["auto", "fixed"]
      }],
      /**
       * Caption Side
       * @see https://tailwindcss.com/docs/caption-side
       */
      caption: [{
        caption: ["top", "bottom"]
      }],
      // ---------------------------------
      // --- Transitions and Animation ---
      // ---------------------------------
      /**
       * Transition Property
       * @see https://tailwindcss.com/docs/transition-property
       */
      transition: [{
        transition: ["", "all", "colors", "opacity", "shadow", "transform", "none", j, A]
      }],
      /**
       * Transition Behavior
       * @see https://tailwindcss.com/docs/transition-behavior
       */
      "transition-behavior": [{
        transition: ["normal", "discrete"]
      }],
      /**
       * Transition Duration
       * @see https://tailwindcss.com/docs/transition-duration
       */
      duration: [{
        duration: [D, "initial", j, A]
      }],
      /**
       * Transition Timing Function
       * @see https://tailwindcss.com/docs/transition-timing-function
       */
      ease: [{
        ease: ["linear", "initial", h, j, A]
      }],
      /**
       * Transition Delay
       * @see https://tailwindcss.com/docs/transition-delay
       */
      delay: [{
        delay: [D, j, A]
      }],
      /**
       * Animation
       * @see https://tailwindcss.com/docs/animation
       */
      animate: [{
        animate: ["none", d, j, A]
      }],
      // ------------------
      // --- Transforms ---
      // ------------------
      /**
       * Backface Visibility
       * @see https://tailwindcss.com/docs/backface-visibility
       */
      backface: [{
        backface: ["hidden", "visible"]
      }],
      /**
       * Perspective
       * @see https://tailwindcss.com/docs/perspective
       */
      perspective: [{
        perspective: [y, j, A]
      }],
      /**
       * Perspective Origin
       * @see https://tailwindcss.com/docs/perspective-origin
       */
      "perspective-origin": [{
        "perspective-origin": P()
      }],
      /**
       * Rotate
       * @see https://tailwindcss.com/docs/rotate
       */
      rotate: [{
        rotate: Qr()
      }],
      /**
       * Rotate X
       * @see https://tailwindcss.com/docs/rotate
       */
      "rotate-x": [{
        "rotate-x": Qr()
      }],
      /**
       * Rotate Y
       * @see https://tailwindcss.com/docs/rotate
       */
      "rotate-y": [{
        "rotate-y": Qr()
      }],
      /**
       * Rotate Z
       * @see https://tailwindcss.com/docs/rotate
       */
      "rotate-z": [{
        "rotate-z": Qr()
      }],
      /**
       * Scale
       * @see https://tailwindcss.com/docs/scale
       */
      scale: [{
        scale: Yr()
      }],
      /**
       * Scale X
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-x": [{
        "scale-x": Yr()
      }],
      /**
       * Scale Y
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-y": [{
        "scale-y": Yr()
      }],
      /**
       * Scale Z
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-z": [{
        "scale-z": Yr()
      }],
      /**
       * Scale 3D
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-3d": ["scale-3d"],
      /**
       * Skew
       * @see https://tailwindcss.com/docs/skew
       */
      skew: [{
        skew: Il()
      }],
      /**
       * Skew X
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-x": [{
        "skew-x": Il()
      }],
      /**
       * Skew Y
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-y": [{
        "skew-y": Il()
      }],
      /**
       * Transform
       * @see https://tailwindcss.com/docs/transform
       */
      transform: [{
        transform: [j, A, "", "none", "gpu", "cpu"]
      }],
      /**
       * Transform Origin
       * @see https://tailwindcss.com/docs/transform-origin
       */
      "transform-origin": [{
        origin: P()
      }],
      /**
       * Transform Style
       * @see https://tailwindcss.com/docs/transform-style
       */
      "transform-style": [{
        transform: ["3d", "flat"]
      }],
      /**
       * Translate
       * @see https://tailwindcss.com/docs/translate
       */
      translate: [{
        translate: Gr()
      }],
      /**
       * Translate X
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-x": [{
        "translate-x": Gr()
      }],
      /**
       * Translate Y
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-y": [{
        "translate-y": Gr()
      }],
      /**
       * Translate Z
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-z": [{
        "translate-z": Gr()
      }],
      /**
       * Translate None
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-none": ["translate-none"],
      // ---------------------
      // --- Interactivity ---
      // ---------------------
      /**
       * Accent Color
       * @see https://tailwindcss.com/docs/accent-color
       */
      accent: [{
        accent: C()
      }],
      /**
       * Appearance
       * @see https://tailwindcss.com/docs/appearance
       */
      appearance: [{
        appearance: ["none", "auto"]
      }],
      /**
       * Caret Color
       * @see https://tailwindcss.com/docs/just-in-time-mode#caret-color-utilities
       */
      "caret-color": [{
        caret: C()
      }],
      /**
       * Color Scheme
       * @see https://tailwindcss.com/docs/color-scheme
       */
      "color-scheme": [{
        scheme: ["normal", "dark", "light", "light-dark", "only-dark", "only-light"]
      }],
      /**
       * Cursor
       * @see https://tailwindcss.com/docs/cursor
       */
      cursor: [{
        cursor: ["auto", "default", "pointer", "wait", "text", "move", "help", "not-allowed", "none", "context-menu", "progress", "cell", "crosshair", "vertical-text", "alias", "copy", "no-drop", "grab", "grabbing", "all-scroll", "col-resize", "row-resize", "n-resize", "e-resize", "s-resize", "w-resize", "ne-resize", "nw-resize", "se-resize", "sw-resize", "ew-resize", "ns-resize", "nesw-resize", "nwse-resize", "zoom-in", "zoom-out", j, A]
      }],
      /**
       * Field Sizing
       * @see https://tailwindcss.com/docs/field-sizing
       */
      "field-sizing": [{
        "field-sizing": ["fixed", "content"]
      }],
      /**
       * Pointer Events
       * @see https://tailwindcss.com/docs/pointer-events
       */
      "pointer-events": [{
        "pointer-events": ["auto", "none"]
      }],
      /**
       * Resize
       * @see https://tailwindcss.com/docs/resize
       */
      resize: [{
        resize: ["none", "", "y", "x"]
      }],
      /**
       * Scroll Behavior
       * @see https://tailwindcss.com/docs/scroll-behavior
       */
      "scroll-behavior": [{
        scroll: ["auto", "smooth"]
      }],
      /**
       * Scroll Margin
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-m": [{
        "scroll-m": k()
      }],
      /**
       * Scroll Margin X
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mx": [{
        "scroll-mx": k()
      }],
      /**
       * Scroll Margin Y
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-my": [{
        "scroll-my": k()
      }],
      /**
       * Scroll Margin Start
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ms": [{
        "scroll-ms": k()
      }],
      /**
       * Scroll Margin End
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-me": [{
        "scroll-me": k()
      }],
      /**
       * Scroll Margin Top
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mt": [{
        "scroll-mt": k()
      }],
      /**
       * Scroll Margin Right
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mr": [{
        "scroll-mr": k()
      }],
      /**
       * Scroll Margin Bottom
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mb": [{
        "scroll-mb": k()
      }],
      /**
       * Scroll Margin Left
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ml": [{
        "scroll-ml": k()
      }],
      /**
       * Scroll Padding
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-p": [{
        "scroll-p": k()
      }],
      /**
       * Scroll Padding X
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-px": [{
        "scroll-px": k()
      }],
      /**
       * Scroll Padding Y
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-py": [{
        "scroll-py": k()
      }],
      /**
       * Scroll Padding Start
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-ps": [{
        "scroll-ps": k()
      }],
      /**
       * Scroll Padding End
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pe": [{
        "scroll-pe": k()
      }],
      /**
       * Scroll Padding Top
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pt": [{
        "scroll-pt": k()
      }],
      /**
       * Scroll Padding Right
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pr": [{
        "scroll-pr": k()
      }],
      /**
       * Scroll Padding Bottom
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pb": [{
        "scroll-pb": k()
      }],
      /**
       * Scroll Padding Left
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pl": [{
        "scroll-pl": k()
      }],
      /**
       * Scroll Snap Align
       * @see https://tailwindcss.com/docs/scroll-snap-align
       */
      "snap-align": [{
        snap: ["start", "end", "center", "align-none"]
      }],
      /**
       * Scroll Snap Stop
       * @see https://tailwindcss.com/docs/scroll-snap-stop
       */
      "snap-stop": [{
        snap: ["normal", "always"]
      }],
      /**
       * Scroll Snap Type
       * @see https://tailwindcss.com/docs/scroll-snap-type
       */
      "snap-type": [{
        snap: ["none", "x", "y", "both"]
      }],
      /**
       * Scroll Snap Type Strictness
       * @see https://tailwindcss.com/docs/scroll-snap-type
       */
      "snap-strictness": [{
        snap: ["mandatory", "proximity"]
      }],
      /**
       * Touch Action
       * @see https://tailwindcss.com/docs/touch-action
       */
      touch: [{
        touch: ["auto", "none", "manipulation"]
      }],
      /**
       * Touch Action X
       * @see https://tailwindcss.com/docs/touch-action
       */
      "touch-x": [{
        "touch-pan": ["x", "left", "right"]
      }],
      /**
       * Touch Action Y
       * @see https://tailwindcss.com/docs/touch-action
       */
      "touch-y": [{
        "touch-pan": ["y", "up", "down"]
      }],
      /**
       * Touch Action Pinch Zoom
       * @see https://tailwindcss.com/docs/touch-action
       */
      "touch-pz": ["touch-pinch-zoom"],
      /**
       * User Select
       * @see https://tailwindcss.com/docs/user-select
       */
      select: [{
        select: ["none", "text", "all", "auto"]
      }],
      /**
       * Will Change
       * @see https://tailwindcss.com/docs/will-change
       */
      "will-change": [{
        "will-change": ["auto", "scroll", "contents", "transform", j, A]
      }],
      // -----------
      // --- SVG ---
      // -----------
      /**
       * Fill
       * @see https://tailwindcss.com/docs/fill
       */
      fill: [{
        fill: ["none", ...C()]
      }],
      /**
       * Stroke Width
       * @see https://tailwindcss.com/docs/stroke-width
       */
      "stroke-w": [{
        stroke: [D, rr, Qt, ai]
      }],
      /**
       * Stroke
       * @see https://tailwindcss.com/docs/stroke
       */
      stroke: [{
        stroke: ["none", ...C()]
      }],
      // ---------------------
      // --- Accessibility ---
      // ---------------------
      /**
       * Forced Color Adjust
       * @see https://tailwindcss.com/docs/forced-color-adjust
       */
      "forced-color-adjust": [{
        "forced-color-adjust": ["auto", "none"]
      }]
    },
    conflictingClassGroups: {
      overflow: ["overflow-x", "overflow-y"],
      overscroll: ["overscroll-x", "overscroll-y"],
      inset: ["inset-x", "inset-y", "start", "end", "top", "right", "bottom", "left"],
      "inset-x": ["right", "left"],
      "inset-y": ["top", "bottom"],
      flex: ["basis", "grow", "shrink"],
      gap: ["gap-x", "gap-y"],
      p: ["px", "py", "ps", "pe", "pt", "pr", "pb", "pl"],
      px: ["pr", "pl"],
      py: ["pt", "pb"],
      m: ["mx", "my", "ms", "me", "mt", "mr", "mb", "ml"],
      mx: ["mr", "ml"],
      my: ["mt", "mb"],
      size: ["w", "h"],
      "font-size": ["leading"],
      "fvn-normal": ["fvn-ordinal", "fvn-slashed-zero", "fvn-figure", "fvn-spacing", "fvn-fraction"],
      "fvn-ordinal": ["fvn-normal"],
      "fvn-slashed-zero": ["fvn-normal"],
      "fvn-figure": ["fvn-normal"],
      "fvn-spacing": ["fvn-normal"],
      "fvn-fraction": ["fvn-normal"],
      "line-clamp": ["display", "overflow"],
      rounded: ["rounded-s", "rounded-e", "rounded-t", "rounded-r", "rounded-b", "rounded-l", "rounded-ss", "rounded-se", "rounded-ee", "rounded-es", "rounded-tl", "rounded-tr", "rounded-br", "rounded-bl"],
      "rounded-s": ["rounded-ss", "rounded-es"],
      "rounded-e": ["rounded-se", "rounded-ee"],
      "rounded-t": ["rounded-tl", "rounded-tr"],
      "rounded-r": ["rounded-tr", "rounded-br"],
      "rounded-b": ["rounded-br", "rounded-bl"],
      "rounded-l": ["rounded-tl", "rounded-bl"],
      "border-spacing": ["border-spacing-x", "border-spacing-y"],
      "border-w": ["border-w-x", "border-w-y", "border-w-s", "border-w-e", "border-w-t", "border-w-r", "border-w-b", "border-w-l"],
      "border-w-x": ["border-w-r", "border-w-l"],
      "border-w-y": ["border-w-t", "border-w-b"],
      "border-color": ["border-color-x", "border-color-y", "border-color-s", "border-color-e", "border-color-t", "border-color-r", "border-color-b", "border-color-l"],
      "border-color-x": ["border-color-r", "border-color-l"],
      "border-color-y": ["border-color-t", "border-color-b"],
      translate: ["translate-x", "translate-y", "translate-none"],
      "translate-none": ["translate", "translate-x", "translate-y", "translate-z"],
      "scroll-m": ["scroll-mx", "scroll-my", "scroll-ms", "scroll-me", "scroll-mt", "scroll-mr", "scroll-mb", "scroll-ml"],
      "scroll-mx": ["scroll-mr", "scroll-ml"],
      "scroll-my": ["scroll-mt", "scroll-mb"],
      "scroll-p": ["scroll-px", "scroll-py", "scroll-ps", "scroll-pe", "scroll-pt", "scroll-pr", "scroll-pb", "scroll-pl"],
      "scroll-px": ["scroll-pr", "scroll-pl"],
      "scroll-py": ["scroll-pt", "scroll-pb"],
      touch: ["touch-x", "touch-y", "touch-pz"],
      "touch-x": ["touch"],
      "touch-y": ["touch"],
      "touch-pz": ["touch"]
    },
    conflictingClassGroupModifiers: {
      "font-size": ["leading"]
    },
    orderSensitiveModifiers: ["*", "**", "after", "backdrop", "before", "details-content", "file", "first-letter", "first-line", "marker", "placeholder", "selection"]
  };
}, Ng = /* @__PURE__ */ lg(Pg);
function oe(...e) {
  return Ng(yf(e));
}
const jf = c.forwardRef(({ className: e, ...t }, n) => /* @__PURE__ */ g.jsx(
  "div",
  {
    ref: n,
    className: oe(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      e
    ),
    ...t
  }
));
jf.displayName = "Card";
const Of = c.forwardRef(({ className: e, ...t }, n) => /* @__PURE__ */ g.jsx(
  "div",
  {
    ref: n,
    className: oe("flex flex-col space-y-1.5 p-6", e),
    ...t
  }
));
Of.displayName = "CardHeader";
const bf = c.forwardRef(({ className: e, ...t }, n) => /* @__PURE__ */ g.jsx(
  "h3",
  {
    ref: n,
    className: oe(
      "text-2xl font-semibold leading-none tracking-tight",
      e
    ),
    ...t
  }
));
bf.displayName = "CardTitle";
const If = c.forwardRef(({ className: e, ...t }, n) => /* @__PURE__ */ g.jsx(
  "p",
  {
    ref: n,
    className: oe("text-sm text-muted-foreground", e),
    ...t
  }
));
If.displayName = "CardDescription";
const _g = c.forwardRef(({ className: e, ...t }, n) => /* @__PURE__ */ g.jsx("div", { ref: n, className: oe("p-6 pt-0", e), ...t }));
_g.displayName = "CardContent";
const Lf = c.forwardRef(({ className: e, ...t }, n) => /* @__PURE__ */ g.jsx(
  "div",
  {
    ref: n,
    className: oe("flex items-center p-6 pt-0", e),
    ...t
  }
));
Lf.displayName = "CardFooter";
function Mu(e, t) {
  if (typeof e == "function")
    return e(t);
  e != null && (e.current = t);
}
function Br(...e) {
  return (t) => {
    let n = !1;
    const r = e.map((o) => {
      const l = Mu(o, t);
      return !n && typeof l == "function" && (n = !0), l;
    });
    if (n)
      return () => {
        for (let o = 0; o < r.length; o++) {
          const l = r[o];
          typeof l == "function" ? l() : Mu(e[o], null);
        }
      };
  };
}
function ae(...e) {
  return c.useCallback(Br(...e), e);
}
var Rg = Symbol.for("react.lazy"), ll = gs[" use ".trim().toString()];
function Tg(e) {
  return typeof e == "object" && e !== null && "then" in e;
}
function Df(e) {
  return e != null && typeof e == "object" && "$$typeof" in e && e.$$typeof === Rg && "_payload" in e && Tg(e._payload);
}
// @__NO_SIDE_EFFECTS__
function Ag(e) {
  const t = /* @__PURE__ */ Og(e), n = c.forwardRef((r, o) => {
    let { children: l, ...i } = r;
    Df(l) && typeof ll == "function" && (l = ll(l._payload));
    const s = c.Children.toArray(l), a = s.find(Ig);
    if (a) {
      const u = a.props.children, f = s.map((m) => m === a ? c.Children.count(u) > 1 ? c.Children.only(null) : c.isValidElement(u) ? u.props.children : null : m);
      return /* @__PURE__ */ g.jsx(t, { ...i, ref: o, children: c.isValidElement(u) ? c.cloneElement(u, void 0, f) : null });
    }
    return /* @__PURE__ */ g.jsx(t, { ...i, ref: o, children: l });
  });
  return n.displayName = `${e}.Slot`, n;
}
var jg = /* @__PURE__ */ Ag("Slot");
// @__NO_SIDE_EFFECTS__
function Og(e) {
  const t = c.forwardRef((n, r) => {
    let { children: o, ...l } = n;
    if (Df(o) && typeof ll == "function" && (o = ll(o._payload)), c.isValidElement(o)) {
      const i = Dg(o), s = Lg(l, o.props);
      return o.type !== c.Fragment && (s.ref = r ? Br(r, i) : i), c.cloneElement(o, s);
    }
    return c.Children.count(o) > 1 ? c.Children.only(null) : null;
  });
  return t.displayName = `${e}.SlotClone`, t;
}
var bg = Symbol("radix.slottable");
function Ig(e) {
  return c.isValidElement(e) && typeof e.type == "function" && "__radixId" in e.type && e.type.__radixId === bg;
}
function Lg(e, t) {
  const n = { ...t };
  for (const r in t) {
    const o = e[r], l = t[r];
    /^on[A-Z]/.test(r) ? o && l ? n[r] = (...s) => {
      const a = l(...s);
      return o(...s), a;
    } : o && (n[r] = o) : r === "style" ? n[r] = { ...o, ...l } : r === "className" && (n[r] = [o, l].filter(Boolean).join(" "));
  }
  return { ...e, ...n };
}
function Dg(e) {
  var r, o;
  let t = (r = Object.getOwnPropertyDescriptor(e.props, "ref")) == null ? void 0 : r.get, n = t && "isReactWarning" in t && t.isReactWarning;
  return n ? e.ref : (t = (o = Object.getOwnPropertyDescriptor(e, "ref")) == null ? void 0 : o.get, n = t && "isReactWarning" in t && t.isReactWarning, n ? e.props.ref : e.props.ref || e.ref);
}
const Fu = (e) => typeof e == "boolean" ? `${e}` : e === 0 ? "0" : e, $u = yf, zg = (e, t) => (n) => {
  var r;
  if ((t == null ? void 0 : t.variants) == null)
    return $u(e, n == null ? void 0 : n.class, n == null ? void 0 : n.className);
  const { variants: o, defaultVariants: l } = t, i = Object.keys(o).map((u) => {
    const f = n == null ? void 0 : n[u], m = l == null ? void 0 : l[u];
    if (f === null)
      return null;
    const p = Fu(f) || Fu(m);
    return o[u][p];
  }), s = n && Object.entries(n).reduce((u, f) => {
    let [m, p] = f;
    return p === void 0 || (u[m] = p), u;
  }, {}), a = t == null || (r = t.compoundVariants) === null || r === void 0 ? void 0 : r.reduce((u, f) => {
    let { class: m, className: p, ...w } = f;
    return Object.entries(w).every((x) => {
      let [y, E] = x;
      return Array.isArray(E) ? E.includes({
        ...l,
        ...s
      }[y]) : {
        ...l,
        ...s
      }[y] === E;
    }) ? [
      ...u,
      m,
      p
    ] : u;
  }, []);
  return $u(e, i, a, n == null ? void 0 : n.class, n == null ? void 0 : n.className);
}, Mg = zg(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
), en = c.forwardRef(
  ({ className: e, variant: t, size: n, asChild: r = !1, ...o }, l) => {
    const i = r ? jg : "button";
    return /* @__PURE__ */ g.jsx(
      i,
      {
        className: oe(Mg({ variant: t, size: n, className: e })),
        ref: l,
        ...o
      }
    );
  }
);
en.displayName = "Button";
const Fg = ({ isOpen: e, onAcceptAll: t, onRejectAll: n, onManage: r, config: o }) => {
  if (!e)
    return null;
  const l = (o == null ? void 0 : o.title) || "We respect your privacy", i = (o == null ? void 0 : o.description) || "We use cookies to improve your experience and analyze site traffic.";
  return /* @__PURE__ */ g.jsx("div", { className: "fixed bottom-4 left-4 right-4 z-[9999] md:left-auto md:right-4 md:w-[400px]", children: /* @__PURE__ */ g.jsxs(jf, { className: "shadow-xl border-primary/20", children: [
    /* @__PURE__ */ g.jsxs(Of, { children: [
      /* @__PURE__ */ g.jsx(bf, { children: l }),
      /* @__PURE__ */ g.jsx(If, { children: i })
    ] }),
    /* @__PURE__ */ g.jsxs(Lf, { className: "flex flex-col gap-2", children: [
      /* @__PURE__ */ g.jsxs("div", { className: "flex w-full gap-2", children: [
        /* @__PURE__ */ g.jsx(en, { className: "flex-1", onClick: t, children: "Accept All" }),
        /* @__PURE__ */ g.jsx(en, { variant: "outline", className: "flex-1", onClick: n, children: "Reject All" })
      ] }),
      /* @__PURE__ */ g.jsx(en, { variant: "ghost", className: "w-full text-xs", onClick: r, children: "Customize Preferences" })
    ] })
  ] }) });
};
function de(e, t, { checkForDefaultPrevented: n = !0 } = {}) {
  return function(o) {
    if (e == null || e(o), n === !1 || !o.defaultPrevented)
      return t == null ? void 0 : t(o);
  };
}
function $g(e, t) {
  const n = c.createContext(t), r = (l) => {
    const { children: i, ...s } = l, a = c.useMemo(() => s, Object.values(s));
    return /* @__PURE__ */ g.jsx(n.Provider, { value: a, children: i });
  };
  r.displayName = e + "Provider";
  function o(l) {
    const i = c.useContext(n);
    if (i)
      return i;
    if (t !== void 0)
      return t;
    throw new Error(`\`${l}\` must be used within \`${e}\``);
  }
  return [r, o];
}
function Gn(e, t = []) {
  let n = [];
  function r(l, i) {
    const s = c.createContext(i), a = n.length;
    n = [...n, i];
    const u = (m) => {
      var h;
      const { scope: p, children: w, ...x } = m, y = ((h = p == null ? void 0 : p[e]) == null ? void 0 : h[a]) || s, E = c.useMemo(() => x, Object.values(x));
      return /* @__PURE__ */ g.jsx(y.Provider, { value: E, children: w });
    };
    u.displayName = l + "Provider";
    function f(m, p) {
      var y;
      const w = ((y = p == null ? void 0 : p[e]) == null ? void 0 : y[a]) || s, x = c.useContext(w);
      if (x)
        return x;
      if (i !== void 0)
        return i;
      throw new Error(`\`${m}\` must be used within \`${l}\``);
    }
    return [u, f];
  }
  const o = () => {
    const l = n.map((i) => c.createContext(i));
    return function(s) {
      const a = (s == null ? void 0 : s[e]) || l;
      return c.useMemo(
        () => ({ [`__scope${e}`]: { ...s, [e]: a } }),
        [s, a]
      );
    };
  };
  return o.scopeName = e, [r, Wg(o, ...t)];
}
function Wg(...e) {
  const t = e[0];
  if (e.length === 1)
    return t;
  const n = () => {
    const r = e.map((o) => ({
      useScope: o(),
      scopeName: o.scopeName
    }));
    return function(l) {
      const i = r.reduce((s, { useScope: a, scopeName: u }) => {
        const m = a(l)[`__scope${u}`];
        return { ...s, ...m };
      }, {});
      return c.useMemo(() => ({ [`__scope${t.scopeName}`]: i }), [i]);
    };
  };
  return n.scopeName = t.scopeName, n;
}
var Vt = globalThis != null && globalThis.document ? c.useLayoutEffect : () => {
}, Vg = gs[" useId ".trim().toString()] || (() => {
}), Ug = 0;
function xr(e) {
  const [t, n] = c.useState(Vg());
  return Vt(() => {
    e || n((r) => r ?? String(Ug++));
  }, [e]), e || (t ? `radix-${t}` : "");
}
var Bg = gs[" useInsertionEffect ".trim().toString()] || Vt;
function Hr({
  prop: e,
  defaultProp: t,
  onChange: n = () => {
  },
  caller: r
}) {
  const [o, l, i] = Hg({
    defaultProp: t,
    onChange: n
  }), s = e !== void 0, a = s ? e : o;
  {
    const f = c.useRef(e !== void 0);
    c.useEffect(() => {
      const m = f.current;
      m !== s && console.warn(
        `${r} is changing from ${m ? "controlled" : "uncontrolled"} to ${s ? "controlled" : "uncontrolled"}. Components should not switch from controlled to uncontrolled (or vice versa). Decide between using a controlled or uncontrolled value for the lifetime of the component.`
      ), f.current = s;
    }, [s, r]);
  }
  const u = c.useCallback(
    (f) => {
      var m;
      if (s) {
        const p = Qg(f) ? f(e) : f;
        p !== e && ((m = i.current) == null || m.call(i, p));
      } else
        l(f);
    },
    [s, e, l, i]
  );
  return [a, u];
}
function Hg({
  defaultProp: e,
  onChange: t
}) {
  const [n, r] = c.useState(e), o = c.useRef(n), l = c.useRef(t);
  return Bg(() => {
    l.current = t;
  }, [t]), c.useEffect(() => {
    var i;
    o.current !== n && ((i = l.current) == null || i.call(l, n), o.current = n);
  }, [n, o]), [n, r, l];
}
function Qg(e) {
  return typeof e == "function";
}
// @__NO_SIDE_EFFECTS__
function Yg(e) {
  const t = /* @__PURE__ */ Gg(e), n = c.forwardRef((r, o) => {
    const { children: l, ...i } = r, s = c.Children.toArray(l), a = s.find(Xg);
    if (a) {
      const u = a.props.children, f = s.map((m) => m === a ? c.Children.count(u) > 1 ? c.Children.only(null) : c.isValidElement(u) ? u.props.children : null : m);
      return /* @__PURE__ */ g.jsx(t, { ...i, ref: o, children: c.isValidElement(u) ? c.cloneElement(u, void 0, f) : null });
    }
    return /* @__PURE__ */ g.jsx(t, { ...i, ref: o, children: l });
  });
  return n.displayName = `${e}.Slot`, n;
}
// @__NO_SIDE_EFFECTS__
function Gg(e) {
  const t = c.forwardRef((n, r) => {
    const { children: o, ...l } = n;
    if (c.isValidElement(o)) {
      const i = Jg(o), s = Zg(l, o.props);
      return o.type !== c.Fragment && (s.ref = r ? Br(r, i) : i), c.cloneElement(o, s);
    }
    return c.Children.count(o) > 1 ? c.Children.only(null) : null;
  });
  return t.displayName = `${e}.SlotClone`, t;
}
var Kg = Symbol("radix.slottable");
function Xg(e) {
  return c.isValidElement(e) && typeof e.type == "function" && "__radixId" in e.type && e.type.__radixId === Kg;
}
function Zg(e, t) {
  const n = { ...t };
  for (const r in t) {
    const o = e[r], l = t[r];
    /^on[A-Z]/.test(r) ? o && l ? n[r] = (...s) => {
      const a = l(...s);
      return o(...s), a;
    } : o && (n[r] = o) : r === "style" ? n[r] = { ...o, ...l } : r === "className" && (n[r] = [o, l].filter(Boolean).join(" "));
  }
  return { ...e, ...n };
}
function Jg(e) {
  var r, o;
  let t = (r = Object.getOwnPropertyDescriptor(e.props, "ref")) == null ? void 0 : r.get, n = t && "isReactWarning" in t && t.isReactWarning;
  return n ? e.ref : (t = (o = Object.getOwnPropertyDescriptor(e, "ref")) == null ? void 0 : o.get, n = t && "isReactWarning" in t && t.isReactWarning, n ? e.props.ref : e.props.ref || e.ref);
}
var qg = [
  "a",
  "button",
  "div",
  "form",
  "h2",
  "h3",
  "img",
  "input",
  "label",
  "li",
  "nav",
  "ol",
  "p",
  "select",
  "span",
  "svg",
  "ul"
], te = qg.reduce((e, t) => {
  const n = /* @__PURE__ */ Yg(`Primitive.${t}`), r = c.forwardRef((o, l) => {
    const { asChild: i, ...s } = o, a = i ? n : t;
    return typeof window < "u" && (window[Symbol.for("radix-ui")] = !0), /* @__PURE__ */ g.jsx(a, { ...s, ref: l });
  });
  return r.displayName = `Primitive.${t}`, { ...e, [t]: r };
}, {});
function ey(e, t) {
  e && aa.flushSync(() => e.dispatchEvent(t));
}
function Me(e) {
  const t = c.useRef(e);
  return c.useEffect(() => {
    t.current = e;
  }), c.useMemo(() => (...n) => {
    var r;
    return (r = t.current) == null ? void 0 : r.call(t, ...n);
  }, []);
}
function ty(e, t = globalThis == null ? void 0 : globalThis.document) {
  const n = Me(e);
  c.useEffect(() => {
    const r = (o) => {
      o.key === "Escape" && n(o);
    };
    return t.addEventListener("keydown", r, { capture: !0 }), () => t.removeEventListener("keydown", r, { capture: !0 });
  }, [n, t]);
}
var ny = "DismissableLayer", cs = "dismissableLayer.update", ry = "dismissableLayer.pointerDownOutside", oy = "dismissableLayer.focusOutside", Wu, zf = c.createContext({
  layers: /* @__PURE__ */ new Set(),
  layersWithOutsidePointerEventsDisabled: /* @__PURE__ */ new Set(),
  branches: /* @__PURE__ */ new Set()
}), Mf = c.forwardRef(
  (e, t) => {
    const {
      disableOutsidePointerEvents: n = !1,
      onEscapeKeyDown: r,
      onPointerDownOutside: o,
      onFocusOutside: l,
      onInteractOutside: i,
      onDismiss: s,
      ...a
    } = e, u = c.useContext(zf), [f, m] = c.useState(null), p = (f == null ? void 0 : f.ownerDocument) ?? (globalThis == null ? void 0 : globalThis.document), [, w] = c.useState({}), x = ae(t, (N) => m(N)), y = Array.from(u.layers), [E] = [...u.layersWithOutsidePointerEventsDisabled].slice(-1), h = y.indexOf(E), d = f ? y.indexOf(f) : -1, v = u.layersWithOutsidePointerEventsDisabled.size > 0, S = d >= h, P = sy((N) => {
      const k = N.target, O = [...u.branches].some((b) => b.contains(k));
      !S || O || (o == null || o(N), i == null || i(N), N.defaultPrevented || s == null || s());
    }, p), R = ay((N) => {
      const k = N.target;
      [...u.branches].some((b) => b.contains(k)) || (l == null || l(N), i == null || i(N), N.defaultPrevented || s == null || s());
    }, p);
    return ty((N) => {
      d === u.layers.size - 1 && (r == null || r(N), !N.defaultPrevented && s && (N.preventDefault(), s()));
    }, p), c.useEffect(() => {
      if (f)
        return n && (u.layersWithOutsidePointerEventsDisabled.size === 0 && (Wu = p.body.style.pointerEvents, p.body.style.pointerEvents = "none"), u.layersWithOutsidePointerEventsDisabled.add(f)), u.layers.add(f), Vu(), () => {
          n && u.layersWithOutsidePointerEventsDisabled.size === 1 && (p.body.style.pointerEvents = Wu);
        };
    }, [f, p, n, u]), c.useEffect(() => () => {
      f && (u.layers.delete(f), u.layersWithOutsidePointerEventsDisabled.delete(f), Vu());
    }, [f, u]), c.useEffect(() => {
      const N = () => w({});
      return document.addEventListener(cs, N), () => document.removeEventListener(cs, N);
    }, []), /* @__PURE__ */ g.jsx(
      te.div,
      {
        ...a,
        ref: x,
        style: {
          pointerEvents: v ? S ? "auto" : "none" : void 0,
          ...e.style
        },
        onFocusCapture: de(e.onFocusCapture, R.onFocusCapture),
        onBlurCapture: de(e.onBlurCapture, R.onBlurCapture),
        onPointerDownCapture: de(
          e.onPointerDownCapture,
          P.onPointerDownCapture
        )
      }
    );
  }
);
Mf.displayName = ny;
var ly = "DismissableLayerBranch", iy = c.forwardRef((e, t) => {
  const n = c.useContext(zf), r = c.useRef(null), o = ae(t, r);
  return c.useEffect(() => {
    const l = r.current;
    if (l)
      return n.branches.add(l), () => {
        n.branches.delete(l);
      };
  }, [n.branches]), /* @__PURE__ */ g.jsx(te.div, { ...e, ref: o });
});
iy.displayName = ly;
function sy(e, t = globalThis == null ? void 0 : globalThis.document) {
  const n = Me(e), r = c.useRef(!1), o = c.useRef(() => {
  });
  return c.useEffect(() => {
    const l = (s) => {
      if (s.target && !r.current) {
        let a = function() {
          Ff(
            ry,
            n,
            u,
            { discrete: !0 }
          );
        };
        const u = { originalEvent: s };
        s.pointerType === "touch" ? (t.removeEventListener("click", o.current), o.current = a, t.addEventListener("click", o.current, { once: !0 })) : a();
      } else
        t.removeEventListener("click", o.current);
      r.current = !1;
    }, i = window.setTimeout(() => {
      t.addEventListener("pointerdown", l);
    }, 0);
    return () => {
      window.clearTimeout(i), t.removeEventListener("pointerdown", l), t.removeEventListener("click", o.current);
    };
  }, [t, n]), {
    // ensures we check React component tree (not just DOM tree)
    onPointerDownCapture: () => r.current = !0
  };
}
function ay(e, t = globalThis == null ? void 0 : globalThis.document) {
  const n = Me(e), r = c.useRef(!1);
  return c.useEffect(() => {
    const o = (l) => {
      l.target && !r.current && Ff(oy, n, { originalEvent: l }, {
        discrete: !1
      });
    };
    return t.addEventListener("focusin", o), () => t.removeEventListener("focusin", o);
  }, [t, n]), {
    onFocusCapture: () => r.current = !0,
    onBlurCapture: () => r.current = !1
  };
}
function Vu() {
  const e = new CustomEvent(cs);
  document.dispatchEvent(e);
}
function Ff(e, t, n, { discrete: r }) {
  const o = n.originalEvent.target, l = new CustomEvent(e, { bubbles: !1, cancelable: !0, detail: n });
  t && o.addEventListener(e, t, { once: !0 }), r ? ey(o, l) : o.dispatchEvent(l);
}
var ui = "focusScope.autoFocusOnMount", ci = "focusScope.autoFocusOnUnmount", Uu = { bubbles: !1, cancelable: !0 }, uy = "FocusScope", $f = c.forwardRef((e, t) => {
  const {
    loop: n = !1,
    trapped: r = !1,
    onMountAutoFocus: o,
    onUnmountAutoFocus: l,
    ...i
  } = e, [s, a] = c.useState(null), u = Me(o), f = Me(l), m = c.useRef(null), p = ae(t, (y) => a(y)), w = c.useRef({
    paused: !1,
    pause() {
      this.paused = !0;
    },
    resume() {
      this.paused = !1;
    }
  }).current;
  c.useEffect(() => {
    if (r) {
      let y = function(v) {
        if (w.paused || !s)
          return;
        const S = v.target;
        s.contains(S) ? m.current = S : Pt(m.current, { select: !0 });
      }, E = function(v) {
        if (w.paused || !s)
          return;
        const S = v.relatedTarget;
        S !== null && (s.contains(S) || Pt(m.current, { select: !0 }));
      }, h = function(v) {
        if (document.activeElement === document.body)
          for (const P of v)
            P.removedNodes.length > 0 && Pt(s);
      };
      document.addEventListener("focusin", y), document.addEventListener("focusout", E);
      const d = new MutationObserver(h);
      return s && d.observe(s, { childList: !0, subtree: !0 }), () => {
        document.removeEventListener("focusin", y), document.removeEventListener("focusout", E), d.disconnect();
      };
    }
  }, [r, s, w.paused]), c.useEffect(() => {
    if (s) {
      Hu.add(w);
      const y = document.activeElement;
      if (!s.contains(y)) {
        const h = new CustomEvent(ui, Uu);
        s.addEventListener(ui, u), s.dispatchEvent(h), h.defaultPrevented || (cy(hy(Wf(s)), { select: !0 }), document.activeElement === y && Pt(s));
      }
      return () => {
        s.removeEventListener(ui, u), setTimeout(() => {
          const h = new CustomEvent(ci, Uu);
          s.addEventListener(ci, f), s.dispatchEvent(h), h.defaultPrevented || Pt(y ?? document.body, { select: !0 }), s.removeEventListener(ci, f), Hu.remove(w);
        }, 0);
      };
    }
  }, [s, u, f, w]);
  const x = c.useCallback(
    (y) => {
      if (!n && !r || w.paused)
        return;
      const E = y.key === "Tab" && !y.altKey && !y.ctrlKey && !y.metaKey, h = document.activeElement;
      if (E && h) {
        const d = y.currentTarget, [v, S] = dy(d);
        v && S ? !y.shiftKey && h === S ? (y.preventDefault(), n && Pt(v, { select: !0 })) : y.shiftKey && h === v && (y.preventDefault(), n && Pt(S, { select: !0 })) : h === d && y.preventDefault();
      }
    },
    [n, r, w.paused]
  );
  return /* @__PURE__ */ g.jsx(te.div, { tabIndex: -1, ...i, ref: p, onKeyDown: x });
});
$f.displayName = uy;
function cy(e, { select: t = !1 } = {}) {
  const n = document.activeElement;
  for (const r of e)
    if (Pt(r, { select: t }), document.activeElement !== n)
      return;
}
function dy(e) {
  const t = Wf(e), n = Bu(t, e), r = Bu(t.reverse(), e);
  return [n, r];
}
function Wf(e) {
  const t = [], n = document.createTreeWalker(e, NodeFilter.SHOW_ELEMENT, {
    acceptNode: (r) => {
      const o = r.tagName === "INPUT" && r.type === "hidden";
      return r.disabled || r.hidden || o ? NodeFilter.FILTER_SKIP : r.tabIndex >= 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
    }
  });
  for (; n.nextNode(); )
    t.push(n.currentNode);
  return t;
}
function Bu(e, t) {
  for (const n of e)
    if (!fy(n, { upTo: t }))
      return n;
}
function fy(e, { upTo: t }) {
  if (getComputedStyle(e).visibility === "hidden")
    return !0;
  for (; e; ) {
    if (t !== void 0 && e === t)
      return !1;
    if (getComputedStyle(e).display === "none")
      return !0;
    e = e.parentElement;
  }
  return !1;
}
function py(e) {
  return e instanceof HTMLInputElement && "select" in e;
}
function Pt(e, { select: t = !1 } = {}) {
  if (e && e.focus) {
    const n = document.activeElement;
    e.focus({ preventScroll: !0 }), e !== n && py(e) && t && e.select();
  }
}
var Hu = my();
function my() {
  let e = [];
  return {
    add(t) {
      const n = e[0];
      t !== n && (n == null || n.pause()), e = Qu(e, t), e.unshift(t);
    },
    remove(t) {
      var n;
      e = Qu(e, t), (n = e[0]) == null || n.resume();
    }
  };
}
function Qu(e, t) {
  const n = [...e], r = n.indexOf(t);
  return r !== -1 && n.splice(r, 1), n;
}
function hy(e) {
  return e.filter((t) => t.tagName !== "A");
}
var vy = "Portal", Vf = c.forwardRef((e, t) => {
  var s;
  const { container: n, ...r } = e, [o, l] = c.useState(!1);
  Vt(() => l(!0), []);
  const i = n || o && ((s = globalThis == null ? void 0 : globalThis.document) == null ? void 0 : s.body);
  return i ? Mv.createPortal(/* @__PURE__ */ g.jsx(te.div, { ...r, ref: t }), i) : null;
});
Vf.displayName = vy;
function gy(e, t) {
  return c.useReducer((n, r) => t[n][r] ?? n, e);
}
var wt = (e) => {
  const { present: t, children: n } = e, r = yy(t), o = typeof n == "function" ? n({ present: r.isPresent }) : c.Children.only(n), l = ae(r.ref, wy(o));
  return typeof n == "function" || r.isPresent ? c.cloneElement(o, { ref: l }) : null;
};
wt.displayName = "Presence";
function yy(e) {
  const [t, n] = c.useState(), r = c.useRef(null), o = c.useRef(e), l = c.useRef("none"), i = e ? "mounted" : "unmounted", [s, a] = gy(i, {
    mounted: {
      UNMOUNT: "unmounted",
      ANIMATION_OUT: "unmountSuspended"
    },
    unmountSuspended: {
      MOUNT: "mounted",
      ANIMATION_END: "unmounted"
    },
    unmounted: {
      MOUNT: "mounted"
    }
  });
  return c.useEffect(() => {
    const u = ho(r.current);
    l.current = s === "mounted" ? u : "none";
  }, [s]), Vt(() => {
    const u = r.current, f = o.current;
    if (f !== e) {
      const p = l.current, w = ho(u);
      e ? a("MOUNT") : w === "none" || (u == null ? void 0 : u.display) === "none" ? a("UNMOUNT") : a(f && p !== w ? "ANIMATION_OUT" : "UNMOUNT"), o.current = e;
    }
  }, [e, a]), Vt(() => {
    if (t) {
      let u;
      const f = t.ownerDocument.defaultView ?? window, m = (w) => {
        const y = ho(r.current).includes(CSS.escape(w.animationName));
        if (w.target === t && y && (a("ANIMATION_END"), !o.current)) {
          const E = t.style.animationFillMode;
          t.style.animationFillMode = "forwards", u = f.setTimeout(() => {
            t.style.animationFillMode === "forwards" && (t.style.animationFillMode = E);
          });
        }
      }, p = (w) => {
        w.target === t && (l.current = ho(r.current));
      };
      return t.addEventListener("animationstart", p), t.addEventListener("animationcancel", m), t.addEventListener("animationend", m), () => {
        f.clearTimeout(u), t.removeEventListener("animationstart", p), t.removeEventListener("animationcancel", m), t.removeEventListener("animationend", m);
      };
    } else
      a("ANIMATION_END");
  }, [t, a]), {
    isPresent: ["mounted", "unmountSuspended"].includes(s),
    ref: c.useCallback((u) => {
      r.current = u ? getComputedStyle(u) : null, n(u);
    }, [])
  };
}
function ho(e) {
  return (e == null ? void 0 : e.animationName) || "none";
}
function wy(e) {
  var r, o;
  let t = (r = Object.getOwnPropertyDescriptor(e.props, "ref")) == null ? void 0 : r.get, n = t && "isReactWarning" in t && t.isReactWarning;
  return n ? e.ref : (t = (o = Object.getOwnPropertyDescriptor(e, "ref")) == null ? void 0 : o.get, n = t && "isReactWarning" in t && t.isReactWarning, n ? e.props.ref : e.props.ref || e.ref);
}
var di = 0;
function Sy() {
  c.useEffect(() => {
    const e = document.querySelectorAll("[data-radix-focus-guard]");
    return document.body.insertAdjacentElement("afterbegin", e[0] ?? Yu()), document.body.insertAdjacentElement("beforeend", e[1] ?? Yu()), di++, () => {
      di === 1 && document.querySelectorAll("[data-radix-focus-guard]").forEach((t) => t.remove()), di--;
    };
  }, []);
}
function Yu() {
  const e = document.createElement("span");
  return e.setAttribute("data-radix-focus-guard", ""), e.tabIndex = 0, e.style.outline = "none", e.style.opacity = "0", e.style.position = "fixed", e.style.pointerEvents = "none", e;
}
var ot = function() {
  return ot = Object.assign || function(t) {
    for (var n, r = 1, o = arguments.length; r < o; r++) {
      n = arguments[r];
      for (var l in n)
        Object.prototype.hasOwnProperty.call(n, l) && (t[l] = n[l]);
    }
    return t;
  }, ot.apply(this, arguments);
};
function Uf(e, t) {
  var n = {};
  for (var r in e)
    Object.prototype.hasOwnProperty.call(e, r) && t.indexOf(r) < 0 && (n[r] = e[r]);
  if (e != null && typeof Object.getOwnPropertySymbols == "function")
    for (var o = 0, r = Object.getOwnPropertySymbols(e); o < r.length; o++)
      t.indexOf(r[o]) < 0 && Object.prototype.propertyIsEnumerable.call(e, r[o]) && (n[r[o]] = e[r[o]]);
  return n;
}
function xy(e, t, n) {
  if (n || arguments.length === 2)
    for (var r = 0, o = t.length, l; r < o; r++)
      (l || !(r in t)) && (l || (l = Array.prototype.slice.call(t, 0, r)), l[r] = t[r]);
  return e.concat(l || Array.prototype.slice.call(t));
}
var Oo = "right-scroll-bar-position", bo = "width-before-scroll-bar", ky = "with-scroll-bars-hidden", Cy = "--removed-body-scroll-bar-size";
function fi(e, t) {
  return typeof e == "function" ? e(t) : e && (e.current = t), e;
}
function Ey(e, t) {
  var n = c.useState(function() {
    return {
      // value
      value: e,
      // last callback
      callback: t,
      // "memoized" public interface
      facade: {
        get current() {
          return n.value;
        },
        set current(r) {
          var o = n.value;
          o !== r && (n.value = r, n.callback(r, o));
        }
      }
    };
  })[0];
  return n.callback = t, n.facade;
}
var Py = typeof window < "u" ? c.useLayoutEffect : c.useEffect, Gu = /* @__PURE__ */ new WeakMap();
function Ny(e, t) {
  var n = Ey(t || null, function(r) {
    return e.forEach(function(o) {
      return fi(o, r);
    });
  });
  return Py(function() {
    var r = Gu.get(n);
    if (r) {
      var o = new Set(r), l = new Set(e), i = n.current;
      o.forEach(function(s) {
        l.has(s) || fi(s, null);
      }), l.forEach(function(s) {
        o.has(s) || fi(s, i);
      });
    }
    Gu.set(n, e);
  }, [e]), n;
}
function _y(e) {
  return e;
}
function Ry(e, t) {
  t === void 0 && (t = _y);
  var n = [], r = !1, o = {
    read: function() {
      if (r)
        throw new Error("Sidecar: could not `read` from an `assigned` medium. `read` could be used only with `useMedium`.");
      return n.length ? n[n.length - 1] : e;
    },
    useMedium: function(l) {
      var i = t(l, r);
      return n.push(i), function() {
        n = n.filter(function(s) {
          return s !== i;
        });
      };
    },
    assignSyncMedium: function(l) {
      for (r = !0; n.length; ) {
        var i = n;
        n = [], i.forEach(l);
      }
      n = {
        push: function(s) {
          return l(s);
        },
        filter: function() {
          return n;
        }
      };
    },
    assignMedium: function(l) {
      r = !0;
      var i = [];
      if (n.length) {
        var s = n;
        n = [], s.forEach(l), i = n;
      }
      var a = function() {
        var f = i;
        i = [], f.forEach(l);
      }, u = function() {
        return Promise.resolve().then(a);
      };
      u(), n = {
        push: function(f) {
          i.push(f), u();
        },
        filter: function(f) {
          return i = i.filter(f), n;
        }
      };
    }
  };
  return o;
}
function Ty(e) {
  e === void 0 && (e = {});
  var t = Ry(null);
  return t.options = ot({ async: !0, ssr: !1 }, e), t;
}
var Bf = function(e) {
  var t = e.sideCar, n = Uf(e, ["sideCar"]);
  if (!t)
    throw new Error("Sidecar: please provide `sideCar` property to import the right car");
  var r = t.read();
  if (!r)
    throw new Error("Sidecar medium not found");
  return c.createElement(r, ot({}, n));
};
Bf.isSideCarExport = !0;
function Ay(e, t) {
  return e.useMedium(t), Bf;
}
var Hf = Ty(), pi = function() {
}, Nl = c.forwardRef(function(e, t) {
  var n = c.useRef(null), r = c.useState({
    onScrollCapture: pi,
    onWheelCapture: pi,
    onTouchMoveCapture: pi
  }), o = r[0], l = r[1], i = e.forwardProps, s = e.children, a = e.className, u = e.removeScrollBar, f = e.enabled, m = e.shards, p = e.sideCar, w = e.noRelative, x = e.noIsolation, y = e.inert, E = e.allowPinchZoom, h = e.as, d = h === void 0 ? "div" : h, v = e.gapMode, S = Uf(e, ["forwardProps", "children", "className", "removeScrollBar", "enabled", "shards", "sideCar", "noRelative", "noIsolation", "inert", "allowPinchZoom", "as", "gapMode"]), P = p, R = Ny([n, t]), N = ot(ot({}, S), o);
  return c.createElement(
    c.Fragment,
    null,
    f && c.createElement(P, { sideCar: Hf, removeScrollBar: u, shards: m, noRelative: w, noIsolation: x, inert: y, setCallbacks: l, allowPinchZoom: !!E, lockRef: n, gapMode: v }),
    i ? c.cloneElement(c.Children.only(s), ot(ot({}, N), { ref: R })) : c.createElement(d, ot({}, N, { className: a, ref: R }), s)
  );
});
Nl.defaultProps = {
  enabled: !0,
  removeScrollBar: !0,
  inert: !1
};
Nl.classNames = {
  fullWidth: bo,
  zeroRight: Oo
};
var Ku, jy = function() {
  if (Ku)
    return Ku;
  if (typeof __webpack_nonce__ < "u")
    return __webpack_nonce__;
};
function Oy() {
  if (!document)
    return null;
  var e = document.createElement("style");
  e.type = "text/css";
  var t = jy();
  return t && e.setAttribute("nonce", t), e;
}
function by(e, t) {
  e.styleSheet ? e.styleSheet.cssText = t : e.appendChild(document.createTextNode(t));
}
function Iy(e) {
  var t = document.head || document.getElementsByTagName("head")[0];
  t.appendChild(e);
}
var Ly = function() {
  var e = 0, t = null;
  return {
    add: function(n) {
      e == 0 && (t = Oy()) && (by(t, n), Iy(t)), e++;
    },
    remove: function() {
      e--, !e && t && (t.parentNode && t.parentNode.removeChild(t), t = null);
    }
  };
}, Dy = function() {
  var e = Ly();
  return function(t, n) {
    c.useEffect(function() {
      return e.add(t), function() {
        e.remove();
      };
    }, [t && n]);
  };
}, Qf = function() {
  var e = Dy(), t = function(n) {
    var r = n.styles, o = n.dynamic;
    return e(r, o), null;
  };
  return t;
}, zy = {
  left: 0,
  top: 0,
  right: 0,
  gap: 0
}, mi = function(e) {
  return parseInt(e || "", 10) || 0;
}, My = function(e) {
  var t = window.getComputedStyle(document.body), n = t[e === "padding" ? "paddingLeft" : "marginLeft"], r = t[e === "padding" ? "paddingTop" : "marginTop"], o = t[e === "padding" ? "paddingRight" : "marginRight"];
  return [mi(n), mi(r), mi(o)];
}, Fy = function(e) {
  if (e === void 0 && (e = "margin"), typeof window > "u")
    return zy;
  var t = My(e), n = document.documentElement.clientWidth, r = window.innerWidth;
  return {
    left: t[0],
    top: t[1],
    right: t[2],
    gap: Math.max(0, r - n + t[2] - t[0])
  };
}, $y = Qf(), In = "data-scroll-locked", Wy = function(e, t, n, r) {
  var o = e.left, l = e.top, i = e.right, s = e.gap;
  return n === void 0 && (n = "margin"), `
  .`.concat(ky, ` {
   overflow: hidden `).concat(r, `;
   padding-right: `).concat(s, "px ").concat(r, `;
  }
  body[`).concat(In, `] {
    overflow: hidden `).concat(r, `;
    overscroll-behavior: contain;
    `).concat([
    t && "position: relative ".concat(r, ";"),
    n === "margin" && `
    padding-left: `.concat(o, `px;
    padding-top: `).concat(l, `px;
    padding-right: `).concat(i, `px;
    margin-left:0;
    margin-top:0;
    margin-right: `).concat(s, "px ").concat(r, `;
    `),
    n === "padding" && "padding-right: ".concat(s, "px ").concat(r, ";")
  ].filter(Boolean).join(""), `
  }
  
  .`).concat(Oo, ` {
    right: `).concat(s, "px ").concat(r, `;
  }
  
  .`).concat(bo, ` {
    margin-right: `).concat(s, "px ").concat(r, `;
  }
  
  .`).concat(Oo, " .").concat(Oo, ` {
    right: 0 `).concat(r, `;
  }
  
  .`).concat(bo, " .").concat(bo, ` {
    margin-right: 0 `).concat(r, `;
  }
  
  body[`).concat(In, `] {
    `).concat(Cy, ": ").concat(s, `px;
  }
`);
}, Xu = function() {
  var e = parseInt(document.body.getAttribute(In) || "0", 10);
  return isFinite(e) ? e : 0;
}, Vy = function() {
  c.useEffect(function() {
    return document.body.setAttribute(In, (Xu() + 1).toString()), function() {
      var e = Xu() - 1;
      e <= 0 ? document.body.removeAttribute(In) : document.body.setAttribute(In, e.toString());
    };
  }, []);
}, Uy = function(e) {
  var t = e.noRelative, n = e.noImportant, r = e.gapMode, o = r === void 0 ? "margin" : r;
  Vy();
  var l = c.useMemo(function() {
    return Fy(o);
  }, [o]);
  return c.createElement($y, { styles: Wy(l, !t, o, n ? "" : "!important") });
}, ds = !1;
if (typeof window < "u")
  try {
    var vo = Object.defineProperty({}, "passive", {
      get: function() {
        return ds = !0, !0;
      }
    });
    window.addEventListener("test", vo, vo), window.removeEventListener("test", vo, vo);
  } catch {
    ds = !1;
  }
var pn = ds ? { passive: !1 } : !1, By = function(e) {
  return e.tagName === "TEXTAREA";
}, Yf = function(e, t) {
  if (!(e instanceof Element))
    return !1;
  var n = window.getComputedStyle(e);
  return (
    // not-not-scrollable
    n[t] !== "hidden" && // contains scroll inside self
    !(n.overflowY === n.overflowX && !By(e) && n[t] === "visible")
  );
}, Hy = function(e) {
  return Yf(e, "overflowY");
}, Qy = function(e) {
  return Yf(e, "overflowX");
}, Zu = function(e, t) {
  var n = t.ownerDocument, r = t;
  do {
    typeof ShadowRoot < "u" && r instanceof ShadowRoot && (r = r.host);
    var o = Gf(e, r);
    if (o) {
      var l = Kf(e, r), i = l[1], s = l[2];
      if (i > s)
        return !0;
    }
    r = r.parentNode;
  } while (r && r !== n.body);
  return !1;
}, Yy = function(e) {
  var t = e.scrollTop, n = e.scrollHeight, r = e.clientHeight;
  return [
    t,
    n,
    r
  ];
}, Gy = function(e) {
  var t = e.scrollLeft, n = e.scrollWidth, r = e.clientWidth;
  return [
    t,
    n,
    r
  ];
}, Gf = function(e, t) {
  return e === "v" ? Hy(t) : Qy(t);
}, Kf = function(e, t) {
  return e === "v" ? Yy(t) : Gy(t);
}, Ky = function(e, t) {
  return e === "h" && t === "rtl" ? -1 : 1;
}, Xy = function(e, t, n, r, o) {
  var l = Ky(e, window.getComputedStyle(t).direction), i = l * r, s = n.target, a = t.contains(s), u = !1, f = i > 0, m = 0, p = 0;
  do {
    if (!s)
      break;
    var w = Kf(e, s), x = w[0], y = w[1], E = w[2], h = y - E - l * x;
    (x || h) && Gf(e, s) && (m += h, p += x);
    var d = s.parentNode;
    s = d && d.nodeType === Node.DOCUMENT_FRAGMENT_NODE ? d.host : d;
  } while (
    // portaled content
    !a && s !== document.body || // self content
    a && (t.contains(s) || t === s)
  );
  return (f && (o && Math.abs(m) < 1 || !o && i > m) || !f && (o && Math.abs(p) < 1 || !o && -i > p)) && (u = !0), u;
}, go = function(e) {
  return "changedTouches" in e ? [e.changedTouches[0].clientX, e.changedTouches[0].clientY] : [0, 0];
}, Ju = function(e) {
  return [e.deltaX, e.deltaY];
}, qu = function(e) {
  return e && "current" in e ? e.current : e;
}, Zy = function(e, t) {
  return e[0] === t[0] && e[1] === t[1];
}, Jy = function(e) {
  return `
  .block-interactivity-`.concat(e, ` {pointer-events: none;}
  .allow-interactivity-`).concat(e, ` {pointer-events: all;}
`);
}, qy = 0, mn = [];
function e0(e) {
  var t = c.useRef([]), n = c.useRef([0, 0]), r = c.useRef(), o = c.useState(qy++)[0], l = c.useState(Qf)[0], i = c.useRef(e);
  c.useEffect(function() {
    i.current = e;
  }, [e]), c.useEffect(function() {
    if (e.inert) {
      document.body.classList.add("block-interactivity-".concat(o));
      var y = xy([e.lockRef.current], (e.shards || []).map(qu), !0).filter(Boolean);
      return y.forEach(function(E) {
        return E.classList.add("allow-interactivity-".concat(o));
      }), function() {
        document.body.classList.remove("block-interactivity-".concat(o)), y.forEach(function(E) {
          return E.classList.remove("allow-interactivity-".concat(o));
        });
      };
    }
  }, [e.inert, e.lockRef.current, e.shards]);
  var s = c.useCallback(function(y, E) {
    if ("touches" in y && y.touches.length === 2 || y.type === "wheel" && y.ctrlKey)
      return !i.current.allowPinchZoom;
    var h = go(y), d = n.current, v = "deltaX" in y ? y.deltaX : d[0] - h[0], S = "deltaY" in y ? y.deltaY : d[1] - h[1], P, R = y.target, N = Math.abs(v) > Math.abs(S) ? "h" : "v";
    if ("touches" in y && N === "h" && R.type === "range")
      return !1;
    var k = window.getSelection(), O = k && k.anchorNode, b = O ? O === R || O.contains(R) : !1;
    if (b)
      return !1;
    var $ = Zu(N, R);
    if (!$)
      return !0;
    if ($ ? P = N : (P = N === "v" ? "h" : "v", $ = Zu(N, R)), !$)
      return !1;
    if (!r.current && "changedTouches" in y && (v || S) && (r.current = P), !P)
      return !0;
    var Ce = r.current || P;
    return Xy(Ce, E, y, Ce === "h" ? v : S, !0);
  }, []), a = c.useCallback(function(y) {
    var E = y;
    if (!(!mn.length || mn[mn.length - 1] !== l)) {
      var h = "deltaY" in E ? Ju(E) : go(E), d = t.current.filter(function(P) {
        return P.name === E.type && (P.target === E.target || E.target === P.shadowParent) && Zy(P.delta, h);
      })[0];
      if (d && d.should) {
        E.cancelable && E.preventDefault();
        return;
      }
      if (!d) {
        var v = (i.current.shards || []).map(qu).filter(Boolean).filter(function(P) {
          return P.contains(E.target);
        }), S = v.length > 0 ? s(E, v[0]) : !i.current.noIsolation;
        S && E.cancelable && E.preventDefault();
      }
    }
  }, []), u = c.useCallback(function(y, E, h, d) {
    var v = { name: y, delta: E, target: h, should: d, shadowParent: t0(h) };
    t.current.push(v), setTimeout(function() {
      t.current = t.current.filter(function(S) {
        return S !== v;
      });
    }, 1);
  }, []), f = c.useCallback(function(y) {
    n.current = go(y), r.current = void 0;
  }, []), m = c.useCallback(function(y) {
    u(y.type, Ju(y), y.target, s(y, e.lockRef.current));
  }, []), p = c.useCallback(function(y) {
    u(y.type, go(y), y.target, s(y, e.lockRef.current));
  }, []);
  c.useEffect(function() {
    return mn.push(l), e.setCallbacks({
      onScrollCapture: m,
      onWheelCapture: m,
      onTouchMoveCapture: p
    }), document.addEventListener("wheel", a, pn), document.addEventListener("touchmove", a, pn), document.addEventListener("touchstart", f, pn), function() {
      mn = mn.filter(function(y) {
        return y !== l;
      }), document.removeEventListener("wheel", a, pn), document.removeEventListener("touchmove", a, pn), document.removeEventListener("touchstart", f, pn);
    };
  }, []);
  var w = e.removeScrollBar, x = e.inert;
  return c.createElement(
    c.Fragment,
    null,
    x ? c.createElement(l, { styles: Jy(o) }) : null,
    w ? c.createElement(Uy, { noRelative: e.noRelative, gapMode: e.gapMode }) : null
  );
}
function t0(e) {
  for (var t = null; e !== null; )
    e instanceof ShadowRoot && (t = e.host, e = e.host), e = e.parentNode;
  return t;
}
const n0 = Ay(Hf, e0);
var Xf = c.forwardRef(function(e, t) {
  return c.createElement(Nl, ot({}, e, { ref: t, sideCar: n0 }));
});
Xf.classNames = Nl.classNames;
const r0 = Xf;
var o0 = function(e) {
  if (typeof document > "u")
    return null;
  var t = Array.isArray(e) ? e[0] : e;
  return t.ownerDocument.body;
}, hn = /* @__PURE__ */ new WeakMap(), yo = /* @__PURE__ */ new WeakMap(), wo = {}, hi = 0, Zf = function(e) {
  return e && (e.host || Zf(e.parentNode));
}, l0 = function(e, t) {
  return t.map(function(n) {
    if (e.contains(n))
      return n;
    var r = Zf(n);
    return r && e.contains(r) ? r : (console.error("aria-hidden", n, "in not contained inside", e, ". Doing nothing"), null);
  }).filter(function(n) {
    return !!n;
  });
}, i0 = function(e, t, n, r) {
  var o = l0(t, Array.isArray(e) ? e : [e]);
  wo[n] || (wo[n] = /* @__PURE__ */ new WeakMap());
  var l = wo[n], i = [], s = /* @__PURE__ */ new Set(), a = new Set(o), u = function(m) {
    !m || s.has(m) || (s.add(m), u(m.parentNode));
  };
  o.forEach(u);
  var f = function(m) {
    !m || a.has(m) || Array.prototype.forEach.call(m.children, function(p) {
      if (s.has(p))
        f(p);
      else
        try {
          var w = p.getAttribute(r), x = w !== null && w !== "false", y = (hn.get(p) || 0) + 1, E = (l.get(p) || 0) + 1;
          hn.set(p, y), l.set(p, E), i.push(p), y === 1 && x && yo.set(p, !0), E === 1 && p.setAttribute(n, "true"), x || p.setAttribute(r, "true");
        } catch (h) {
          console.error("aria-hidden: cannot operate on ", p, h);
        }
    });
  };
  return f(t), s.clear(), hi++, function() {
    i.forEach(function(m) {
      var p = hn.get(m) - 1, w = l.get(m) - 1;
      hn.set(m, p), l.set(m, w), p || (yo.has(m) || m.removeAttribute(r), yo.delete(m)), w || m.removeAttribute(n);
    }), hi--, hi || (hn = /* @__PURE__ */ new WeakMap(), hn = /* @__PURE__ */ new WeakMap(), yo = /* @__PURE__ */ new WeakMap(), wo = {});
  };
}, s0 = function(e, t, n) {
  n === void 0 && (n = "data-aria-hidden");
  var r = Array.from(Array.isArray(e) ? e : [e]), o = t || o0(e);
  return o ? (r.push.apply(r, Array.from(o.querySelectorAll("[aria-live], script"))), i0(r, o, n, "aria-hidden")) : function() {
    return null;
  };
};
// @__NO_SIDE_EFFECTS__
function a0(e) {
  const t = /* @__PURE__ */ u0(e), n = c.forwardRef((r, o) => {
    const { children: l, ...i } = r, s = c.Children.toArray(l), a = s.find(d0);
    if (a) {
      const u = a.props.children, f = s.map((m) => m === a ? c.Children.count(u) > 1 ? c.Children.only(null) : c.isValidElement(u) ? u.props.children : null : m);
      return /* @__PURE__ */ g.jsx(t, { ...i, ref: o, children: c.isValidElement(u) ? c.cloneElement(u, void 0, f) : null });
    }
    return /* @__PURE__ */ g.jsx(t, { ...i, ref: o, children: l });
  });
  return n.displayName = `${e}.Slot`, n;
}
// @__NO_SIDE_EFFECTS__
function u0(e) {
  const t = c.forwardRef((n, r) => {
    const { children: o, ...l } = n;
    if (c.isValidElement(o)) {
      const i = p0(o), s = f0(l, o.props);
      return o.type !== c.Fragment && (s.ref = r ? Br(r, i) : i), c.cloneElement(o, s);
    }
    return c.Children.count(o) > 1 ? c.Children.only(null) : null;
  });
  return t.displayName = `${e}.SlotClone`, t;
}
var c0 = Symbol("radix.slottable");
function d0(e) {
  return c.isValidElement(e) && typeof e.type == "function" && "__radixId" in e.type && e.type.__radixId === c0;
}
function f0(e, t) {
  const n = { ...t };
  for (const r in t) {
    const o = e[r], l = t[r];
    /^on[A-Z]/.test(r) ? o && l ? n[r] = (...s) => {
      const a = l(...s);
      return o(...s), a;
    } : o && (n[r] = o) : r === "style" ? n[r] = { ...o, ...l } : r === "className" && (n[r] = [o, l].filter(Boolean).join(" "));
  }
  return { ...e, ...n };
}
function p0(e) {
  var r, o;
  let t = (r = Object.getOwnPropertyDescriptor(e.props, "ref")) == null ? void 0 : r.get, n = t && "isReactWarning" in t && t.isReactWarning;
  return n ? e.ref : (t = (o = Object.getOwnPropertyDescriptor(e, "ref")) == null ? void 0 : o.get, n = t && "isReactWarning" in t && t.isReactWarning, n ? e.props.ref : e.props.ref || e.ref);
}
var _l = "Dialog", [Jf, M1] = Gn(_l), [m0, Je] = Jf(_l), qf = (e) => {
  const {
    __scopeDialog: t,
    children: n,
    open: r,
    defaultOpen: o,
    onOpenChange: l,
    modal: i = !0
  } = e, s = c.useRef(null), a = c.useRef(null), [u, f] = Hr({
    prop: r,
    defaultProp: o ?? !1,
    onChange: l,
    caller: _l
  });
  return /* @__PURE__ */ g.jsx(
    m0,
    {
      scope: t,
      triggerRef: s,
      contentRef: a,
      contentId: xr(),
      titleId: xr(),
      descriptionId: xr(),
      open: u,
      onOpenChange: f,
      onOpenToggle: c.useCallback(() => f((m) => !m), [f]),
      modal: i,
      children: n
    }
  );
};
qf.displayName = _l;
var ep = "DialogTrigger", h0 = c.forwardRef(
  (e, t) => {
    const { __scopeDialog: n, ...r } = e, o = Je(ep, n), l = ae(t, o.triggerRef);
    return /* @__PURE__ */ g.jsx(
      te.button,
      {
        type: "button",
        "aria-haspopup": "dialog",
        "aria-expanded": o.open,
        "aria-controls": o.contentId,
        "data-state": fa(o.open),
        ...r,
        ref: l,
        onClick: de(e.onClick, o.onOpenToggle)
      }
    );
  }
);
h0.displayName = ep;
var ca = "DialogPortal", [v0, tp] = Jf(ca, {
  forceMount: void 0
}), np = (e) => {
  const { __scopeDialog: t, forceMount: n, children: r, container: o } = e, l = Je(ca, t);
  return /* @__PURE__ */ g.jsx(v0, { scope: t, forceMount: n, children: c.Children.map(r, (i) => /* @__PURE__ */ g.jsx(wt, { present: n || l.open, children: /* @__PURE__ */ g.jsx(Vf, { asChild: !0, container: o, children: i }) })) });
};
np.displayName = ca;
var il = "DialogOverlay", rp = c.forwardRef(
  (e, t) => {
    const n = tp(il, e.__scopeDialog), { forceMount: r = n.forceMount, ...o } = e, l = Je(il, e.__scopeDialog);
    return l.modal ? /* @__PURE__ */ g.jsx(wt, { present: r || l.open, children: /* @__PURE__ */ g.jsx(y0, { ...o, ref: t }) }) : null;
  }
);
rp.displayName = il;
var g0 = /* @__PURE__ */ a0("DialogOverlay.RemoveScroll"), y0 = c.forwardRef(
  (e, t) => {
    const { __scopeDialog: n, ...r } = e, o = Je(il, n);
    return (
      // Make sure `Content` is scrollable even when it doesn't live inside `RemoveScroll`
      // ie. when `Overlay` and `Content` are siblings
      /* @__PURE__ */ g.jsx(r0, { as: g0, allowPinchZoom: !0, shards: [o.contentRef], children: /* @__PURE__ */ g.jsx(
        te.div,
        {
          "data-state": fa(o.open),
          ...r,
          ref: t,
          style: { pointerEvents: "auto", ...r.style }
        }
      ) })
    );
  }
), sn = "DialogContent", op = c.forwardRef(
  (e, t) => {
    const n = tp(sn, e.__scopeDialog), { forceMount: r = n.forceMount, ...o } = e, l = Je(sn, e.__scopeDialog);
    return /* @__PURE__ */ g.jsx(wt, { present: r || l.open, children: l.modal ? /* @__PURE__ */ g.jsx(w0, { ...o, ref: t }) : /* @__PURE__ */ g.jsx(S0, { ...o, ref: t }) });
  }
);
op.displayName = sn;
var w0 = c.forwardRef(
  (e, t) => {
    const n = Je(sn, e.__scopeDialog), r = c.useRef(null), o = ae(t, n.contentRef, r);
    return c.useEffect(() => {
      const l = r.current;
      if (l)
        return s0(l);
    }, []), /* @__PURE__ */ g.jsx(
      lp,
      {
        ...e,
        ref: o,
        trapFocus: n.open,
        disableOutsidePointerEvents: !0,
        onCloseAutoFocus: de(e.onCloseAutoFocus, (l) => {
          var i;
          l.preventDefault(), (i = n.triggerRef.current) == null || i.focus();
        }),
        onPointerDownOutside: de(e.onPointerDownOutside, (l) => {
          const i = l.detail.originalEvent, s = i.button === 0 && i.ctrlKey === !0;
          (i.button === 2 || s) && l.preventDefault();
        }),
        onFocusOutside: de(
          e.onFocusOutside,
          (l) => l.preventDefault()
        )
      }
    );
  }
), S0 = c.forwardRef(
  (e, t) => {
    const n = Je(sn, e.__scopeDialog), r = c.useRef(!1), o = c.useRef(!1);
    return /* @__PURE__ */ g.jsx(
      lp,
      {
        ...e,
        ref: t,
        trapFocus: !1,
        disableOutsidePointerEvents: !1,
        onCloseAutoFocus: (l) => {
          var i, s;
          (i = e.onCloseAutoFocus) == null || i.call(e, l), l.defaultPrevented || (r.current || (s = n.triggerRef.current) == null || s.focus(), l.preventDefault()), r.current = !1, o.current = !1;
        },
        onInteractOutside: (l) => {
          var a, u;
          (a = e.onInteractOutside) == null || a.call(e, l), l.defaultPrevented || (r.current = !0, l.detail.originalEvent.type === "pointerdown" && (o.current = !0));
          const i = l.target;
          ((u = n.triggerRef.current) == null ? void 0 : u.contains(i)) && l.preventDefault(), l.detail.originalEvent.type === "focusin" && o.current && l.preventDefault();
        }
      }
    );
  }
), lp = c.forwardRef(
  (e, t) => {
    const { __scopeDialog: n, trapFocus: r, onOpenAutoFocus: o, onCloseAutoFocus: l, ...i } = e, s = Je(sn, n), a = c.useRef(null), u = ae(t, a);
    return Sy(), /* @__PURE__ */ g.jsxs(g.Fragment, { children: [
      /* @__PURE__ */ g.jsx(
        $f,
        {
          asChild: !0,
          loop: !0,
          trapped: r,
          onMountAutoFocus: o,
          onUnmountAutoFocus: l,
          children: /* @__PURE__ */ g.jsx(
            Mf,
            {
              role: "dialog",
              id: s.contentId,
              "aria-describedby": s.descriptionId,
              "aria-labelledby": s.titleId,
              "data-state": fa(s.open),
              ...i,
              ref: u,
              onDismiss: () => s.onOpenChange(!1)
            }
          )
        }
      ),
      /* @__PURE__ */ g.jsxs(g.Fragment, { children: [
        /* @__PURE__ */ g.jsx(x0, { titleId: s.titleId }),
        /* @__PURE__ */ g.jsx(C0, { contentRef: a, descriptionId: s.descriptionId })
      ] })
    ] });
  }
), da = "DialogTitle", ip = c.forwardRef(
  (e, t) => {
    const { __scopeDialog: n, ...r } = e, o = Je(da, n);
    return /* @__PURE__ */ g.jsx(te.h2, { id: o.titleId, ...r, ref: t });
  }
);
ip.displayName = da;
var sp = "DialogDescription", ap = c.forwardRef(
  (e, t) => {
    const { __scopeDialog: n, ...r } = e, o = Je(sp, n);
    return /* @__PURE__ */ g.jsx(te.p, { id: o.descriptionId, ...r, ref: t });
  }
);
ap.displayName = sp;
var up = "DialogClose", cp = c.forwardRef(
  (e, t) => {
    const { __scopeDialog: n, ...r } = e, o = Je(up, n);
    return /* @__PURE__ */ g.jsx(
      te.button,
      {
        type: "button",
        ...r,
        ref: t,
        onClick: de(e.onClick, () => o.onOpenChange(!1))
      }
    );
  }
);
cp.displayName = up;
function fa(e) {
  return e ? "open" : "closed";
}
var dp = "DialogTitleWarning", [F1, fp] = $g(dp, {
  contentName: sn,
  titleName: da,
  docsSlug: "dialog"
}), x0 = ({ titleId: e }) => {
  const t = fp(dp), n = `\`${t.contentName}\` requires a \`${t.titleName}\` for the component to be accessible for screen reader users.

If you want to hide the \`${t.titleName}\`, you can wrap it with our VisuallyHidden component.

For more information, see https://radix-ui.com/primitives/docs/components/${t.docsSlug}`;
  return c.useEffect(() => {
    e && (document.getElementById(e) || console.error(n));
  }, [n, e]), null;
}, k0 = "DialogDescriptionWarning", C0 = ({ contentRef: e, descriptionId: t }) => {
  const r = `Warning: Missing \`Description\` or \`aria-describedby={undefined}\` for {${fp(k0).contentName}}.`;
  return c.useEffect(() => {
    var l;
    const o = (l = e.current) == null ? void 0 : l.getAttribute("aria-describedby");
    t && o && (document.getElementById(t) || console.warn(r));
  }, [r, e, t]), null;
}, E0 = qf, P0 = np, pp = rp, mp = op, hp = ip, vp = ap, N0 = cp;
/**
 * @license lucide-react v0.556.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const _0 = (e) => e.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase(), R0 = (e) => e.replace(
  /^([A-Z])|[\s-_]+(\w)/g,
  (t, n, r) => r ? r.toUpperCase() : n.toLowerCase()
), ec = (e) => {
  const t = R0(e);
  return t.charAt(0).toUpperCase() + t.slice(1);
}, gp = (...e) => e.filter((t, n, r) => !!t && t.trim() !== "" && r.indexOf(t) === n).join(" ").trim(), T0 = (e) => {
  for (const t in e)
    if (t.startsWith("aria-") || t === "role" || t === "title")
      return !0;
};
/**
 * @license lucide-react v0.556.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
var A0 = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round"
};
/**
 * @license lucide-react v0.556.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const j0 = c.forwardRef(
  ({
    color: e = "currentColor",
    size: t = 24,
    strokeWidth: n = 2,
    absoluteStrokeWidth: r,
    className: o = "",
    children: l,
    iconNode: i,
    ...s
  }, a) => c.createElement(
    "svg",
    {
      ref: a,
      ...A0,
      width: t,
      height: t,
      stroke: e,
      strokeWidth: r ? Number(n) * 24 / Number(t) : n,
      className: gp("lucide", o),
      ...!l && !T0(s) && { "aria-hidden": "true" },
      ...s
    },
    [
      ...i.map(([u, f]) => c.createElement(u, f)),
      ...Array.isArray(l) ? l : [l]
    ]
  )
);
/**
 * @license lucide-react v0.556.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const pa = (e, t) => {
  const n = c.forwardRef(
    ({ className: r, ...o }, l) => c.createElement(j0, {
      ref: l,
      iconNode: t,
      className: gp(
        `lucide-${_0(ec(e))}`,
        `lucide-${e}`,
        r
      ),
      ...o
    })
  );
  return n.displayName = ec(e), n;
};
/**
 * @license lucide-react v0.556.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const O0 = [["path", { d: "m6 9 6 6 6-6", key: "qrunsl" }]], b0 = pa("chevron-down", O0);
/**
 * @license lucide-react v0.556.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const I0 = [
  [
    "path",
    {
      d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
      key: "oel41y"
    }
  ],
  ["path", { d: "m9 12 2 2 4-4", key: "dzmm74" }]
], L0 = pa("shield-check", I0);
/**
 * @license lucide-react v0.556.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const D0 = [
  ["path", { d: "M18 6 6 18", key: "1bl5f8" }],
  ["path", { d: "m6 6 12 12", key: "d8bk6v" }]
], z0 = pa("x", D0), M0 = E0, F0 = P0, yp = c.forwardRef(({ className: e, ...t }, n) => /* @__PURE__ */ g.jsx(
  pp,
  {
    ref: n,
    className: oe(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      e
    ),
    ...t
  }
));
yp.displayName = pp.displayName;
const wp = c.forwardRef(({ className: e, children: t, ...n }, r) => /* @__PURE__ */ g.jsxs(F0, { children: [
  /* @__PURE__ */ g.jsx(yp, {}),
  /* @__PURE__ */ g.jsxs(
    mp,
    {
      ref: r,
      className: oe(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        e
      ),
      ...n,
      children: [
        t,
        /* @__PURE__ */ g.jsxs(N0, { className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground", children: [
          /* @__PURE__ */ g.jsx(z0, { className: "h-4 w-4" }),
          /* @__PURE__ */ g.jsx("span", { className: "sr-only", children: "Close" })
        ] })
      ]
    }
  )
] }));
wp.displayName = mp.displayName;
const Sp = ({
  className: e,
  ...t
}) => /* @__PURE__ */ g.jsx(
  "div",
  {
    className: oe(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      e
    ),
    ...t
  }
);
Sp.displayName = "DialogHeader";
const xp = ({
  className: e,
  ...t
}) => /* @__PURE__ */ g.jsx(
  "div",
  {
    className: oe(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      e
    ),
    ...t
  }
);
xp.displayName = "DialogFooter";
const kp = c.forwardRef(({ className: e, ...t }, n) => /* @__PURE__ */ g.jsx(
  hp,
  {
    ref: n,
    className: oe(
      "text-lg font-semibold leading-none tracking-tight",
      e
    ),
    ...t
  }
));
kp.displayName = hp.displayName;
const Cp = c.forwardRef(({ className: e, ...t }, n) => /* @__PURE__ */ g.jsx(
  vp,
  {
    ref: n,
    className: oe("text-sm text-muted-foreground", e),
    ...t
  }
));
Cp.displayName = vp.displayName;
function $0(e) {
  const t = c.useRef({ value: e, previous: e });
  return c.useMemo(() => (t.current.value !== e && (t.current.previous = t.current.value, t.current.value = e), t.current.previous), [e]);
}
function W0(e) {
  const [t, n] = c.useState(void 0);
  return Vt(() => {
    if (e) {
      n({ width: e.offsetWidth, height: e.offsetHeight });
      const r = new ResizeObserver((o) => {
        if (!Array.isArray(o) || !o.length)
          return;
        const l = o[0];
        let i, s;
        if ("borderBoxSize" in l) {
          const a = l.borderBoxSize, u = Array.isArray(a) ? a[0] : a;
          i = u.inlineSize, s = u.blockSize;
        } else
          i = e.offsetWidth, s = e.offsetHeight;
        n({ width: i, height: s });
      });
      return r.observe(e, { box: "border-box" }), () => r.unobserve(e);
    } else
      n(void 0);
  }, [e]), t;
}
var Rl = "Switch", [V0, $1] = Gn(Rl), [U0, B0] = V0(Rl), Ep = c.forwardRef(
  (e, t) => {
    const {
      __scopeSwitch: n,
      name: r,
      checked: o,
      defaultChecked: l,
      required: i,
      disabled: s,
      value: a = "on",
      onCheckedChange: u,
      form: f,
      ...m
    } = e, [p, w] = c.useState(null), x = ae(t, (v) => w(v)), y = c.useRef(!1), E = p ? f || !!p.closest("form") : !0, [h, d] = Hr({
      prop: o,
      defaultProp: l ?? !1,
      onChange: u,
      caller: Rl
    });
    return /* @__PURE__ */ g.jsxs(U0, { scope: n, checked: h, disabled: s, children: [
      /* @__PURE__ */ g.jsx(
        te.button,
        {
          type: "button",
          role: "switch",
          "aria-checked": h,
          "aria-required": i,
          "data-state": Rp(h),
          "data-disabled": s ? "" : void 0,
          disabled: s,
          value: a,
          ...m,
          ref: x,
          onClick: de(e.onClick, (v) => {
            d((S) => !S), E && (y.current = v.isPropagationStopped(), y.current || v.stopPropagation());
          })
        }
      ),
      E && /* @__PURE__ */ g.jsx(
        _p,
        {
          control: p,
          bubbles: !y.current,
          name: r,
          value: a,
          checked: h,
          required: i,
          disabled: s,
          form: f,
          style: { transform: "translateX(-100%)" }
        }
      )
    ] });
  }
);
Ep.displayName = Rl;
var Pp = "SwitchThumb", Np = c.forwardRef(
  (e, t) => {
    const { __scopeSwitch: n, ...r } = e, o = B0(Pp, n);
    return /* @__PURE__ */ g.jsx(
      te.span,
      {
        "data-state": Rp(o.checked),
        "data-disabled": o.disabled ? "" : void 0,
        ...r,
        ref: t
      }
    );
  }
);
Np.displayName = Pp;
var H0 = "SwitchBubbleInput", _p = c.forwardRef(
  ({
    __scopeSwitch: e,
    control: t,
    checked: n,
    bubbles: r = !0,
    ...o
  }, l) => {
    const i = c.useRef(null), s = ae(i, l), a = $0(n), u = W0(t);
    return c.useEffect(() => {
      const f = i.current;
      if (!f)
        return;
      const m = window.HTMLInputElement.prototype, w = Object.getOwnPropertyDescriptor(
        m,
        "checked"
      ).set;
      if (a !== n && w) {
        const x = new Event("click", { bubbles: r });
        w.call(f, n), f.dispatchEvent(x);
      }
    }, [a, n, r]), /* @__PURE__ */ g.jsx(
      "input",
      {
        type: "checkbox",
        "aria-hidden": !0,
        defaultChecked: n,
        ...o,
        tabIndex: -1,
        ref: s,
        style: {
          ...o.style,
          ...u,
          position: "absolute",
          pointerEvents: "none",
          opacity: 0,
          margin: 0
        }
      }
    );
  }
);
_p.displayName = H0;
function Rp(e) {
  return e ? "checked" : "unchecked";
}
var Tp = Ep, Q0 = Np;
const ar = c.forwardRef(({ className: e, ...t }, n) => /* @__PURE__ */ g.jsx(
  Tp,
  {
    className: oe(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      e
    ),
    ...t,
    ref: n,
    children: /* @__PURE__ */ g.jsx(
      Q0,
      {
        className: oe(
          "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
        )
      }
    )
  }
));
ar.displayName = Tp.displayName;
var Y0 = c.createContext(void 0);
function Ap(e) {
  const t = c.useContext(Y0);
  return e || t || "ltr";
}
function G0(e, [t, n]) {
  return Math.min(n, Math.max(t, e));
}
function K0(e, t) {
  return c.useReducer((n, r) => t[n][r] ?? n, e);
}
var ma = "ScrollArea", [jp, W1] = Gn(ma), [X0, Ue] = jp(ma), Op = c.forwardRef(
  (e, t) => {
    const {
      __scopeScrollArea: n,
      type: r = "hover",
      dir: o,
      scrollHideDelay: l = 600,
      ...i
    } = e, [s, a] = c.useState(null), [u, f] = c.useState(null), [m, p] = c.useState(null), [w, x] = c.useState(null), [y, E] = c.useState(null), [h, d] = c.useState(0), [v, S] = c.useState(0), [P, R] = c.useState(!1), [N, k] = c.useState(!1), O = ae(t, ($) => a($)), b = Ap(o);
    return /* @__PURE__ */ g.jsx(
      X0,
      {
        scope: n,
        type: r,
        dir: b,
        scrollHideDelay: l,
        scrollArea: s,
        viewport: u,
        onViewportChange: f,
        content: m,
        onContentChange: p,
        scrollbarX: w,
        onScrollbarXChange: x,
        scrollbarXEnabled: P,
        onScrollbarXEnabledChange: R,
        scrollbarY: y,
        onScrollbarYChange: E,
        scrollbarYEnabled: N,
        onScrollbarYEnabledChange: k,
        onCornerWidthChange: d,
        onCornerHeightChange: S,
        children: /* @__PURE__ */ g.jsx(
          te.div,
          {
            dir: b,
            ...i,
            ref: O,
            style: {
              position: "relative",
              // Pass corner sizes as CSS vars to reduce re-renders of context consumers
              "--radix-scroll-area-corner-width": h + "px",
              "--radix-scroll-area-corner-height": v + "px",
              ...e.style
            }
          }
        )
      }
    );
  }
);
Op.displayName = ma;
var bp = "ScrollAreaViewport", Ip = c.forwardRef(
  (e, t) => {
    const { __scopeScrollArea: n, children: r, nonce: o, ...l } = e, i = Ue(bp, n), s = c.useRef(null), a = ae(t, s, i.onViewportChange);
    return /* @__PURE__ */ g.jsxs(g.Fragment, { children: [
      /* @__PURE__ */ g.jsx(
        "style",
        {
          dangerouslySetInnerHTML: {
            __html: "[data-radix-scroll-area-viewport]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}[data-radix-scroll-area-viewport]::-webkit-scrollbar{display:none}"
          },
          nonce: o
        }
      ),
      /* @__PURE__ */ g.jsx(
        te.div,
        {
          "data-radix-scroll-area-viewport": "",
          ...l,
          ref: a,
          style: {
            /**
             * We don't support `visible` because the intention is to have at least one scrollbar
             * if this component is used and `visible` will behave like `auto` in that case
             * https://developer.mozilla.org/en-US/docs/Web/CSS/overflow#description
             *
             * We don't handle `auto` because the intention is for the native implementation
             * to be hidden if using this component. We just want to ensure the node is scrollable
             * so could have used either `scroll` or `auto` here. We picked `scroll` to prevent
             * the browser from having to work out whether to render native scrollbars or not,
             * we tell it to with the intention of hiding them in CSS.
             */
            overflowX: i.scrollbarXEnabled ? "scroll" : "hidden",
            overflowY: i.scrollbarYEnabled ? "scroll" : "hidden",
            ...e.style
          },
          children: /* @__PURE__ */ g.jsx("div", { ref: i.onContentChange, style: { minWidth: "100%", display: "table" }, children: r })
        }
      )
    ] });
  }
);
Ip.displayName = bp;
var st = "ScrollAreaScrollbar", Lp = c.forwardRef(
  (e, t) => {
    const { forceMount: n, ...r } = e, o = Ue(st, e.__scopeScrollArea), { onScrollbarXEnabledChange: l, onScrollbarYEnabledChange: i } = o, s = e.orientation === "horizontal";
    return c.useEffect(() => (s ? l(!0) : i(!0), () => {
      s ? l(!1) : i(!1);
    }), [s, l, i]), o.type === "hover" ? /* @__PURE__ */ g.jsx(Z0, { ...r, ref: t, forceMount: n }) : o.type === "scroll" ? /* @__PURE__ */ g.jsx(J0, { ...r, ref: t, forceMount: n }) : o.type === "auto" ? /* @__PURE__ */ g.jsx(Dp, { ...r, ref: t, forceMount: n }) : o.type === "always" ? /* @__PURE__ */ g.jsx(ha, { ...r, ref: t }) : null;
  }
);
Lp.displayName = st;
var Z0 = c.forwardRef((e, t) => {
  const { forceMount: n, ...r } = e, o = Ue(st, e.__scopeScrollArea), [l, i] = c.useState(!1);
  return c.useEffect(() => {
    const s = o.scrollArea;
    let a = 0;
    if (s) {
      const u = () => {
        window.clearTimeout(a), i(!0);
      }, f = () => {
        a = window.setTimeout(() => i(!1), o.scrollHideDelay);
      };
      return s.addEventListener("pointerenter", u), s.addEventListener("pointerleave", f), () => {
        window.clearTimeout(a), s.removeEventListener("pointerenter", u), s.removeEventListener("pointerleave", f);
      };
    }
  }, [o.scrollArea, o.scrollHideDelay]), /* @__PURE__ */ g.jsx(wt, { present: n || l, children: /* @__PURE__ */ g.jsx(
    Dp,
    {
      "data-state": l ? "visible" : "hidden",
      ...r,
      ref: t
    }
  ) });
}), J0 = c.forwardRef((e, t) => {
  const { forceMount: n, ...r } = e, o = Ue(st, e.__scopeScrollArea), l = e.orientation === "horizontal", i = Al(() => a("SCROLL_END"), 100), [s, a] = K0("hidden", {
    hidden: {
      SCROLL: "scrolling"
    },
    scrolling: {
      SCROLL_END: "idle",
      POINTER_ENTER: "interacting"
    },
    interacting: {
      SCROLL: "interacting",
      POINTER_LEAVE: "idle"
    },
    idle: {
      HIDE: "hidden",
      SCROLL: "scrolling",
      POINTER_ENTER: "interacting"
    }
  });
  return c.useEffect(() => {
    if (s === "idle") {
      const u = window.setTimeout(() => a("HIDE"), o.scrollHideDelay);
      return () => window.clearTimeout(u);
    }
  }, [s, o.scrollHideDelay, a]), c.useEffect(() => {
    const u = o.viewport, f = l ? "scrollLeft" : "scrollTop";
    if (u) {
      let m = u[f];
      const p = () => {
        const w = u[f];
        m !== w && (a("SCROLL"), i()), m = w;
      };
      return u.addEventListener("scroll", p), () => u.removeEventListener("scroll", p);
    }
  }, [o.viewport, l, a, i]), /* @__PURE__ */ g.jsx(wt, { present: n || s !== "hidden", children: /* @__PURE__ */ g.jsx(
    ha,
    {
      "data-state": s === "hidden" ? "hidden" : "visible",
      ...r,
      ref: t,
      onPointerEnter: de(e.onPointerEnter, () => a("POINTER_ENTER")),
      onPointerLeave: de(e.onPointerLeave, () => a("POINTER_LEAVE"))
    }
  ) });
}), Dp = c.forwardRef((e, t) => {
  const n = Ue(st, e.__scopeScrollArea), { forceMount: r, ...o } = e, [l, i] = c.useState(!1), s = e.orientation === "horizontal", a = Al(() => {
    if (n.viewport) {
      const u = n.viewport.offsetWidth < n.viewport.scrollWidth, f = n.viewport.offsetHeight < n.viewport.scrollHeight;
      i(s ? u : f);
    }
  }, 10);
  return Vn(n.viewport, a), Vn(n.content, a), /* @__PURE__ */ g.jsx(wt, { present: r || l, children: /* @__PURE__ */ g.jsx(
    ha,
    {
      "data-state": l ? "visible" : "hidden",
      ...o,
      ref: t
    }
  ) });
}), ha = c.forwardRef((e, t) => {
  const { orientation: n = "vertical", ...r } = e, o = Ue(st, e.__scopeScrollArea), l = c.useRef(null), i = c.useRef(0), [s, a] = c.useState({
    content: 0,
    viewport: 0,
    scrollbar: { size: 0, paddingStart: 0, paddingEnd: 0 }
  }), u = Wp(s.viewport, s.content), f = {
    ...r,
    sizes: s,
    onSizesChange: a,
    hasThumb: u > 0 && u < 1,
    onThumbChange: (p) => l.current = p,
    onThumbPointerUp: () => i.current = 0,
    onThumbPointerDown: (p) => i.current = p
  };
  function m(p, w) {
    return o1(p, i.current, s, w);
  }
  return n === "horizontal" ? /* @__PURE__ */ g.jsx(
    q0,
    {
      ...f,
      ref: t,
      onThumbPositionChange: () => {
        if (o.viewport && l.current) {
          const p = o.viewport.scrollLeft, w = tc(p, s, o.dir);
          l.current.style.transform = `translate3d(${w}px, 0, 0)`;
        }
      },
      onWheelScroll: (p) => {
        o.viewport && (o.viewport.scrollLeft = p);
      },
      onDragScroll: (p) => {
        o.viewport && (o.viewport.scrollLeft = m(p, o.dir));
      }
    }
  ) : n === "vertical" ? /* @__PURE__ */ g.jsx(
    e1,
    {
      ...f,
      ref: t,
      onThumbPositionChange: () => {
        if (o.viewport && l.current) {
          const p = o.viewport.scrollTop, w = tc(p, s);
          l.current.style.transform = `translate3d(0, ${w}px, 0)`;
        }
      },
      onWheelScroll: (p) => {
        o.viewport && (o.viewport.scrollTop = p);
      },
      onDragScroll: (p) => {
        o.viewport && (o.viewport.scrollTop = m(p));
      }
    }
  ) : null;
}), q0 = c.forwardRef((e, t) => {
  const { sizes: n, onSizesChange: r, ...o } = e, l = Ue(st, e.__scopeScrollArea), [i, s] = c.useState(), a = c.useRef(null), u = ae(t, a, l.onScrollbarXChange);
  return c.useEffect(() => {
    a.current && s(getComputedStyle(a.current));
  }, [a]), /* @__PURE__ */ g.jsx(
    Mp,
    {
      "data-orientation": "horizontal",
      ...o,
      ref: u,
      sizes: n,
      style: {
        bottom: 0,
        left: l.dir === "rtl" ? "var(--radix-scroll-area-corner-width)" : 0,
        right: l.dir === "ltr" ? "var(--radix-scroll-area-corner-width)" : 0,
        "--radix-scroll-area-thumb-width": Tl(n) + "px",
        ...e.style
      },
      onThumbPointerDown: (f) => e.onThumbPointerDown(f.x),
      onDragScroll: (f) => e.onDragScroll(f.x),
      onWheelScroll: (f, m) => {
        if (l.viewport) {
          const p = l.viewport.scrollLeft + f.deltaX;
          e.onWheelScroll(p), Up(p, m) && f.preventDefault();
        }
      },
      onResize: () => {
        a.current && l.viewport && i && r({
          content: l.viewport.scrollWidth,
          viewport: l.viewport.offsetWidth,
          scrollbar: {
            size: a.current.clientWidth,
            paddingStart: al(i.paddingLeft),
            paddingEnd: al(i.paddingRight)
          }
        });
      }
    }
  );
}), e1 = c.forwardRef((e, t) => {
  const { sizes: n, onSizesChange: r, ...o } = e, l = Ue(st, e.__scopeScrollArea), [i, s] = c.useState(), a = c.useRef(null), u = ae(t, a, l.onScrollbarYChange);
  return c.useEffect(() => {
    a.current && s(getComputedStyle(a.current));
  }, [a]), /* @__PURE__ */ g.jsx(
    Mp,
    {
      "data-orientation": "vertical",
      ...o,
      ref: u,
      sizes: n,
      style: {
        top: 0,
        right: l.dir === "ltr" ? 0 : void 0,
        left: l.dir === "rtl" ? 0 : void 0,
        bottom: "var(--radix-scroll-area-corner-height)",
        "--radix-scroll-area-thumb-height": Tl(n) + "px",
        ...e.style
      },
      onThumbPointerDown: (f) => e.onThumbPointerDown(f.y),
      onDragScroll: (f) => e.onDragScroll(f.y),
      onWheelScroll: (f, m) => {
        if (l.viewport) {
          const p = l.viewport.scrollTop + f.deltaY;
          e.onWheelScroll(p), Up(p, m) && f.preventDefault();
        }
      },
      onResize: () => {
        a.current && l.viewport && i && r({
          content: l.viewport.scrollHeight,
          viewport: l.viewport.offsetHeight,
          scrollbar: {
            size: a.current.clientHeight,
            paddingStart: al(i.paddingTop),
            paddingEnd: al(i.paddingBottom)
          }
        });
      }
    }
  );
}), [t1, zp] = jp(st), Mp = c.forwardRef((e, t) => {
  const {
    __scopeScrollArea: n,
    sizes: r,
    hasThumb: o,
    onThumbChange: l,
    onThumbPointerUp: i,
    onThumbPointerDown: s,
    onThumbPositionChange: a,
    onDragScroll: u,
    onWheelScroll: f,
    onResize: m,
    ...p
  } = e, w = Ue(st, n), [x, y] = c.useState(null), E = ae(t, (O) => y(O)), h = c.useRef(null), d = c.useRef(""), v = w.viewport, S = r.content - r.viewport, P = Me(f), R = Me(a), N = Al(m, 10);
  function k(O) {
    if (h.current) {
      const b = O.clientX - h.current.left, $ = O.clientY - h.current.top;
      u({ x: b, y: $ });
    }
  }
  return c.useEffect(() => {
    const O = (b) => {
      const $ = b.target;
      (x == null ? void 0 : x.contains($)) && P(b, S);
    };
    return document.addEventListener("wheel", O, { passive: !1 }), () => document.removeEventListener("wheel", O, { passive: !1 });
  }, [v, x, S, P]), c.useEffect(R, [r, R]), Vn(x, N), Vn(w.content, N), /* @__PURE__ */ g.jsx(
    t1,
    {
      scope: n,
      scrollbar: x,
      hasThumb: o,
      onThumbChange: Me(l),
      onThumbPointerUp: Me(i),
      onThumbPositionChange: R,
      onThumbPointerDown: Me(s),
      children: /* @__PURE__ */ g.jsx(
        te.div,
        {
          ...p,
          ref: E,
          style: { position: "absolute", ...p.style },
          onPointerDown: de(e.onPointerDown, (O) => {
            O.button === 0 && (O.target.setPointerCapture(O.pointerId), h.current = x.getBoundingClientRect(), d.current = document.body.style.webkitUserSelect, document.body.style.webkitUserSelect = "none", w.viewport && (w.viewport.style.scrollBehavior = "auto"), k(O));
          }),
          onPointerMove: de(e.onPointerMove, k),
          onPointerUp: de(e.onPointerUp, (O) => {
            const b = O.target;
            b.hasPointerCapture(O.pointerId) && b.releasePointerCapture(O.pointerId), document.body.style.webkitUserSelect = d.current, w.viewport && (w.viewport.style.scrollBehavior = ""), h.current = null;
          })
        }
      )
    }
  );
}), sl = "ScrollAreaThumb", Fp = c.forwardRef(
  (e, t) => {
    const { forceMount: n, ...r } = e, o = zp(sl, e.__scopeScrollArea);
    return /* @__PURE__ */ g.jsx(wt, { present: n || o.hasThumb, children: /* @__PURE__ */ g.jsx(n1, { ref: t, ...r }) });
  }
), n1 = c.forwardRef(
  (e, t) => {
    const { __scopeScrollArea: n, style: r, ...o } = e, l = Ue(sl, n), i = zp(sl, n), { onThumbPositionChange: s } = i, a = ae(
      t,
      (m) => i.onThumbChange(m)
    ), u = c.useRef(void 0), f = Al(() => {
      u.current && (u.current(), u.current = void 0);
    }, 100);
    return c.useEffect(() => {
      const m = l.viewport;
      if (m) {
        const p = () => {
          if (f(), !u.current) {
            const w = l1(m, s);
            u.current = w, s();
          }
        };
        return s(), m.addEventListener("scroll", p), () => m.removeEventListener("scroll", p);
      }
    }, [l.viewport, f, s]), /* @__PURE__ */ g.jsx(
      te.div,
      {
        "data-state": i.hasThumb ? "visible" : "hidden",
        ...o,
        ref: a,
        style: {
          width: "var(--radix-scroll-area-thumb-width)",
          height: "var(--radix-scroll-area-thumb-height)",
          ...r
        },
        onPointerDownCapture: de(e.onPointerDownCapture, (m) => {
          const w = m.target.getBoundingClientRect(), x = m.clientX - w.left, y = m.clientY - w.top;
          i.onThumbPointerDown({ x, y });
        }),
        onPointerUp: de(e.onPointerUp, i.onThumbPointerUp)
      }
    );
  }
);
Fp.displayName = sl;
var va = "ScrollAreaCorner", $p = c.forwardRef(
  (e, t) => {
    const n = Ue(va, e.__scopeScrollArea), r = !!(n.scrollbarX && n.scrollbarY);
    return n.type !== "scroll" && r ? /* @__PURE__ */ g.jsx(r1, { ...e, ref: t }) : null;
  }
);
$p.displayName = va;
var r1 = c.forwardRef((e, t) => {
  const { __scopeScrollArea: n, ...r } = e, o = Ue(va, n), [l, i] = c.useState(0), [s, a] = c.useState(0), u = !!(l && s);
  return Vn(o.scrollbarX, () => {
    var m;
    const f = ((m = o.scrollbarX) == null ? void 0 : m.offsetHeight) || 0;
    o.onCornerHeightChange(f), a(f);
  }), Vn(o.scrollbarY, () => {
    var m;
    const f = ((m = o.scrollbarY) == null ? void 0 : m.offsetWidth) || 0;
    o.onCornerWidthChange(f), i(f);
  }), u ? /* @__PURE__ */ g.jsx(
    te.div,
    {
      ...r,
      ref: t,
      style: {
        width: l,
        height: s,
        position: "absolute",
        right: o.dir === "ltr" ? 0 : void 0,
        left: o.dir === "rtl" ? 0 : void 0,
        bottom: 0,
        ...e.style
      }
    }
  ) : null;
});
function al(e) {
  return e ? parseInt(e, 10) : 0;
}
function Wp(e, t) {
  const n = e / t;
  return isNaN(n) ? 0 : n;
}
function Tl(e) {
  const t = Wp(e.viewport, e.content), n = e.scrollbar.paddingStart + e.scrollbar.paddingEnd, r = (e.scrollbar.size - n) * t;
  return Math.max(r, 18);
}
function o1(e, t, n, r = "ltr") {
  const o = Tl(n), l = o / 2, i = t || l, s = o - i, a = n.scrollbar.paddingStart + i, u = n.scrollbar.size - n.scrollbar.paddingEnd - s, f = n.content - n.viewport, m = r === "ltr" ? [0, f] : [f * -1, 0];
  return Vp([a, u], m)(e);
}
function tc(e, t, n = "ltr") {
  const r = Tl(t), o = t.scrollbar.paddingStart + t.scrollbar.paddingEnd, l = t.scrollbar.size - o, i = t.content - t.viewport, s = l - r, a = n === "ltr" ? [0, i] : [i * -1, 0], u = G0(e, a);
  return Vp([0, i], [0, s])(u);
}
function Vp(e, t) {
  return (n) => {
    if (e[0] === e[1] || t[0] === t[1])
      return t[0];
    const r = (t[1] - t[0]) / (e[1] - e[0]);
    return t[0] + r * (n - e[0]);
  };
}
function Up(e, t) {
  return e > 0 && e < t;
}
var l1 = (e, t = () => {
}) => {
  let n = { left: e.scrollLeft, top: e.scrollTop }, r = 0;
  return function o() {
    const l = { left: e.scrollLeft, top: e.scrollTop }, i = n.left !== l.left, s = n.top !== l.top;
    (i || s) && t(), n = l, r = window.requestAnimationFrame(o);
  }(), () => window.cancelAnimationFrame(r);
};
function Al(e, t) {
  const n = Me(e), r = c.useRef(0);
  return c.useEffect(() => () => window.clearTimeout(r.current), []), c.useCallback(() => {
    window.clearTimeout(r.current), r.current = window.setTimeout(n, t);
  }, [n, t]);
}
function Vn(e, t) {
  const n = Me(t);
  Vt(() => {
    let r = 0;
    if (e) {
      const o = new ResizeObserver(() => {
        cancelAnimationFrame(r), r = window.requestAnimationFrame(n);
      });
      return o.observe(e), () => {
        window.cancelAnimationFrame(r), o.unobserve(e);
      };
    }
  }, [e, n]);
}
var Bp = Op, i1 = Ip, Hp = Lp, s1 = Fp, a1 = $p;
const Qp = c.forwardRef(({ className: e, children: t, ...n }, r) => /* @__PURE__ */ g.jsxs(
  Bp,
  {
    ref: r,
    className: oe("relative overflow-hidden", e),
    ...n,
    children: [
      /* @__PURE__ */ g.jsx(i1, { className: "h-full w-full rounded-[inherit]", children: t }),
      /* @__PURE__ */ g.jsx(Yp, {}),
      /* @__PURE__ */ g.jsx(a1, {})
    ]
  }
));
Qp.displayName = Bp.displayName;
const Yp = c.forwardRef(({ className: e, orientation: t = "vertical", ...n }, r) => /* @__PURE__ */ g.jsx(
  Hp,
  {
    ref: r,
    orientation: t,
    className: oe(
      "flex touch-none select-none transition-colors",
      t === "vertical" && "h-full w-2.5 border-l border-l-transparent p-[1px]",
      t === "horizontal" && "h-2.5 flex-col border-t border-t-transparent p-[1px]",
      e
    ),
    ...n,
    children: /* @__PURE__ */ g.jsx(s1, { className: "relative flex-1 rounded-full bg-border" })
  }
));
Yp.displayName = Hp.displayName;
// @__NO_SIDE_EFFECTS__
function nc(e) {
  const t = /* @__PURE__ */ u1(e), n = c.forwardRef((r, o) => {
    const { children: l, ...i } = r, s = c.Children.toArray(l), a = s.find(d1);
    if (a) {
      const u = a.props.children, f = s.map((m) => m === a ? c.Children.count(u) > 1 ? c.Children.only(null) : c.isValidElement(u) ? u.props.children : null : m);
      return /* @__PURE__ */ g.jsx(t, { ...i, ref: o, children: c.isValidElement(u) ? c.cloneElement(u, void 0, f) : null });
    }
    return /* @__PURE__ */ g.jsx(t, { ...i, ref: o, children: l });
  });
  return n.displayName = `${e}.Slot`, n;
}
// @__NO_SIDE_EFFECTS__
function u1(e) {
  const t = c.forwardRef((n, r) => {
    const { children: o, ...l } = n;
    if (c.isValidElement(o)) {
      const i = p1(o), s = f1(l, o.props);
      return o.type !== c.Fragment && (s.ref = r ? Br(r, i) : i), c.cloneElement(o, s);
    }
    return c.Children.count(o) > 1 ? c.Children.only(null) : null;
  });
  return t.displayName = `${e}.SlotClone`, t;
}
var c1 = Symbol("radix.slottable");
function d1(e) {
  return c.isValidElement(e) && typeof e.type == "function" && "__radixId" in e.type && e.type.__radixId === c1;
}
function f1(e, t) {
  const n = { ...t };
  for (const r in t) {
    const o = e[r], l = t[r];
    /^on[A-Z]/.test(r) ? o && l ? n[r] = (...s) => {
      const a = l(...s);
      return o(...s), a;
    } : o && (n[r] = o) : r === "style" ? n[r] = { ...o, ...l } : r === "className" && (n[r] = [o, l].filter(Boolean).join(" "));
  }
  return { ...e, ...n };
}
function p1(e) {
  var r, o;
  let t = (r = Object.getOwnPropertyDescriptor(e.props, "ref")) == null ? void 0 : r.get, n = t && "isReactWarning" in t && t.isReactWarning;
  return n ? e.ref : (t = (o = Object.getOwnPropertyDescriptor(e, "ref")) == null ? void 0 : o.get, n = t && "isReactWarning" in t && t.isReactWarning, n ? e.props.ref : e.props.ref || e.ref);
}
function m1(e) {
  const t = e + "CollectionProvider", [n, r] = Gn(t), [o, l] = n(
    t,
    { collectionRef: { current: null }, itemMap: /* @__PURE__ */ new Map() }
  ), i = (y) => {
    const { scope: E, children: h } = y, d = J.useRef(null), v = J.useRef(/* @__PURE__ */ new Map()).current;
    return /* @__PURE__ */ g.jsx(o, { scope: E, itemMap: v, collectionRef: d, children: h });
  };
  i.displayName = t;
  const s = e + "CollectionSlot", a = /* @__PURE__ */ nc(s), u = J.forwardRef(
    (y, E) => {
      const { scope: h, children: d } = y, v = l(s, h), S = ae(E, v.collectionRef);
      return /* @__PURE__ */ g.jsx(a, { ref: S, children: d });
    }
  );
  u.displayName = s;
  const f = e + "CollectionItemSlot", m = "data-radix-collection-item", p = /* @__PURE__ */ nc(f), w = J.forwardRef(
    (y, E) => {
      const { scope: h, children: d, ...v } = y, S = J.useRef(null), P = ae(E, S), R = l(f, h);
      return J.useEffect(() => (R.itemMap.set(S, { ref: S, ...v }), () => void R.itemMap.delete(S))), /* @__PURE__ */ g.jsx(p, { [m]: "", ref: P, children: d });
    }
  );
  w.displayName = f;
  function x(y) {
    const E = l(e + "CollectionConsumer", y);
    return J.useCallback(() => {
      const d = E.collectionRef.current;
      if (!d)
        return [];
      const v = Array.from(d.querySelectorAll(`[${m}]`));
      return Array.from(E.itemMap.values()).sort(
        (R, N) => v.indexOf(R.ref.current) - v.indexOf(N.ref.current)
      );
    }, [E.collectionRef, E.itemMap]);
  }
  return [
    { Provider: i, Slot: u, ItemSlot: w },
    x,
    r
  ];
}
var jl = "Collapsible", [h1, Gp] = Gn(jl), [v1, ga] = h1(jl), Kp = c.forwardRef(
  (e, t) => {
    const {
      __scopeCollapsible: n,
      open: r,
      defaultOpen: o,
      disabled: l,
      onOpenChange: i,
      ...s
    } = e, [a, u] = Hr({
      prop: r,
      defaultProp: o ?? !1,
      onChange: i,
      caller: jl
    });
    return /* @__PURE__ */ g.jsx(
      v1,
      {
        scope: n,
        disabled: l,
        contentId: xr(),
        open: a,
        onOpenToggle: c.useCallback(() => u((f) => !f), [u]),
        children: /* @__PURE__ */ g.jsx(
          te.div,
          {
            "data-state": wa(a),
            "data-disabled": l ? "" : void 0,
            ...s,
            ref: t
          }
        )
      }
    );
  }
);
Kp.displayName = jl;
var Xp = "CollapsibleTrigger", Zp = c.forwardRef(
  (e, t) => {
    const { __scopeCollapsible: n, ...r } = e, o = ga(Xp, n);
    return /* @__PURE__ */ g.jsx(
      te.button,
      {
        type: "button",
        "aria-controls": o.contentId,
        "aria-expanded": o.open || !1,
        "data-state": wa(o.open),
        "data-disabled": o.disabled ? "" : void 0,
        disabled: o.disabled,
        ...r,
        ref: t,
        onClick: de(e.onClick, o.onOpenToggle)
      }
    );
  }
);
Zp.displayName = Xp;
var ya = "CollapsibleContent", Jp = c.forwardRef(
  (e, t) => {
    const { forceMount: n, ...r } = e, o = ga(ya, e.__scopeCollapsible);
    return /* @__PURE__ */ g.jsx(wt, { present: n || o.open, children: ({ present: l }) => /* @__PURE__ */ g.jsx(g1, { ...r, ref: t, present: l }) });
  }
);
Jp.displayName = ya;
var g1 = c.forwardRef((e, t) => {
  const { __scopeCollapsible: n, present: r, children: o, ...l } = e, i = ga(ya, n), [s, a] = c.useState(r), u = c.useRef(null), f = ae(t, u), m = c.useRef(0), p = m.current, w = c.useRef(0), x = w.current, y = i.open || s, E = c.useRef(y), h = c.useRef(void 0);
  return c.useEffect(() => {
    const d = requestAnimationFrame(() => E.current = !1);
    return () => cancelAnimationFrame(d);
  }, []), Vt(() => {
    const d = u.current;
    if (d) {
      h.current = h.current || {
        transitionDuration: d.style.transitionDuration,
        animationName: d.style.animationName
      }, d.style.transitionDuration = "0s", d.style.animationName = "none";
      const v = d.getBoundingClientRect();
      m.current = v.height, w.current = v.width, E.current || (d.style.transitionDuration = h.current.transitionDuration, d.style.animationName = h.current.animationName), a(r);
    }
  }, [i.open, r]), /* @__PURE__ */ g.jsx(
    te.div,
    {
      "data-state": wa(i.open),
      "data-disabled": i.disabled ? "" : void 0,
      id: i.contentId,
      hidden: !y,
      ...l,
      ref: f,
      style: {
        "--radix-collapsible-content-height": p ? `${p}px` : void 0,
        "--radix-collapsible-content-width": x ? `${x}px` : void 0,
        ...e.style
      },
      children: y && o
    }
  );
});
function wa(e) {
  return e ? "open" : "closed";
}
var y1 = Kp, w1 = Zp, S1 = Jp, qe = "Accordion", x1 = ["Home", "End", "ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"], [Sa, k1, C1] = m1(qe), [Ol, V1] = Gn(qe, [
  C1,
  Gp
]), xa = Gp(), qp = J.forwardRef(
  (e, t) => {
    const { type: n, ...r } = e, o = r, l = r;
    return /* @__PURE__ */ g.jsx(Sa.Provider, { scope: e.__scopeAccordion, children: n === "multiple" ? /* @__PURE__ */ g.jsx(_1, { ...l, ref: t }) : /* @__PURE__ */ g.jsx(N1, { ...o, ref: t }) });
  }
);
qp.displayName = qe;
var [em, E1] = Ol(qe), [tm, P1] = Ol(
  qe,
  { collapsible: !1 }
), N1 = J.forwardRef(
  (e, t) => {
    const {
      value: n,
      defaultValue: r,
      onValueChange: o = () => {
      },
      collapsible: l = !1,
      ...i
    } = e, [s, a] = Hr({
      prop: n,
      defaultProp: r ?? "",
      onChange: o,
      caller: qe
    });
    return /* @__PURE__ */ g.jsx(
      em,
      {
        scope: e.__scopeAccordion,
        value: J.useMemo(() => s ? [s] : [], [s]),
        onItemOpen: a,
        onItemClose: J.useCallback(() => l && a(""), [l, a]),
        children: /* @__PURE__ */ g.jsx(tm, { scope: e.__scopeAccordion, collapsible: l, children: /* @__PURE__ */ g.jsx(nm, { ...i, ref: t }) })
      }
    );
  }
), _1 = J.forwardRef((e, t) => {
  const {
    value: n,
    defaultValue: r,
    onValueChange: o = () => {
    },
    ...l
  } = e, [i, s] = Hr({
    prop: n,
    defaultProp: r ?? [],
    onChange: o,
    caller: qe
  }), a = J.useCallback(
    (f) => s((m = []) => [...m, f]),
    [s]
  ), u = J.useCallback(
    (f) => s((m = []) => m.filter((p) => p !== f)),
    [s]
  );
  return /* @__PURE__ */ g.jsx(
    em,
    {
      scope: e.__scopeAccordion,
      value: i,
      onItemOpen: a,
      onItemClose: u,
      children: /* @__PURE__ */ g.jsx(tm, { scope: e.__scopeAccordion, collapsible: !0, children: /* @__PURE__ */ g.jsx(nm, { ...l, ref: t }) })
    }
  );
}), [R1, bl] = Ol(qe), nm = J.forwardRef(
  (e, t) => {
    const { __scopeAccordion: n, disabled: r, dir: o, orientation: l = "vertical", ...i } = e, s = J.useRef(null), a = ae(s, t), u = k1(n), m = Ap(o) === "ltr", p = de(e.onKeyDown, (w) => {
      var k;
      if (!x1.includes(w.key))
        return;
      const x = w.target, y = u().filter((O) => {
        var b;
        return !((b = O.ref.current) != null && b.disabled);
      }), E = y.findIndex((O) => O.ref.current === x), h = y.length;
      if (E === -1)
        return;
      w.preventDefault();
      let d = E;
      const v = 0, S = h - 1, P = () => {
        d = E + 1, d > S && (d = v);
      }, R = () => {
        d = E - 1, d < v && (d = S);
      };
      switch (w.key) {
        case "Home":
          d = v;
          break;
        case "End":
          d = S;
          break;
        case "ArrowRight":
          l === "horizontal" && (m ? P() : R());
          break;
        case "ArrowDown":
          l === "vertical" && P();
          break;
        case "ArrowLeft":
          l === "horizontal" && (m ? R() : P());
          break;
        case "ArrowUp":
          l === "vertical" && R();
          break;
      }
      const N = d % h;
      (k = y[N].ref.current) == null || k.focus();
    });
    return /* @__PURE__ */ g.jsx(
      R1,
      {
        scope: n,
        disabled: r,
        direction: o,
        orientation: l,
        children: /* @__PURE__ */ g.jsx(Sa.Slot, { scope: n, children: /* @__PURE__ */ g.jsx(
          te.div,
          {
            ...i,
            "data-orientation": l,
            ref: a,
            onKeyDown: r ? void 0 : p
          }
        ) })
      }
    );
  }
), ul = "AccordionItem", [T1, ka] = Ol(ul), rm = J.forwardRef(
  (e, t) => {
    const { __scopeAccordion: n, value: r, ...o } = e, l = bl(ul, n), i = E1(ul, n), s = xa(n), a = xr(), u = r && i.value.includes(r) || !1, f = l.disabled || e.disabled;
    return /* @__PURE__ */ g.jsx(
      T1,
      {
        scope: n,
        open: u,
        disabled: f,
        triggerId: a,
        children: /* @__PURE__ */ g.jsx(
          y1,
          {
            "data-orientation": l.orientation,
            "data-state": um(u),
            ...s,
            ...o,
            ref: t,
            disabled: f,
            open: u,
            onOpenChange: (m) => {
              m ? i.onItemOpen(r) : i.onItemClose(r);
            }
          }
        )
      }
    );
  }
);
rm.displayName = ul;
var om = "AccordionHeader", lm = J.forwardRef(
  (e, t) => {
    const { __scopeAccordion: n, ...r } = e, o = bl(qe, n), l = ka(om, n);
    return /* @__PURE__ */ g.jsx(
      te.h3,
      {
        "data-orientation": o.orientation,
        "data-state": um(l.open),
        "data-disabled": l.disabled ? "" : void 0,
        ...r,
        ref: t
      }
    );
  }
);
lm.displayName = om;
var fs = "AccordionTrigger", im = J.forwardRef(
  (e, t) => {
    const { __scopeAccordion: n, ...r } = e, o = bl(qe, n), l = ka(fs, n), i = P1(fs, n), s = xa(n);
    return /* @__PURE__ */ g.jsx(Sa.ItemSlot, { scope: n, children: /* @__PURE__ */ g.jsx(
      w1,
      {
        "aria-disabled": l.open && !i.collapsible || void 0,
        "data-orientation": o.orientation,
        id: l.triggerId,
        ...s,
        ...r,
        ref: t
      }
    ) });
  }
);
im.displayName = fs;
var sm = "AccordionContent", am = J.forwardRef(
  (e, t) => {
    const { __scopeAccordion: n, ...r } = e, o = bl(qe, n), l = ka(sm, n), i = xa(n);
    return /* @__PURE__ */ g.jsx(
      S1,
      {
        role: "region",
        "aria-labelledby": l.triggerId,
        "data-orientation": o.orientation,
        ...i,
        ...r,
        ref: t,
        style: {
          "--radix-accordion-content-height": "var(--radix-collapsible-content-height)",
          "--radix-accordion-content-width": "var(--radix-collapsible-content-width)",
          ...e.style
        }
      }
    );
  }
);
am.displayName = sm;
function um(e) {
  return e ? "open" : "closed";
}
var A1 = qp, j1 = rm, O1 = lm, cm = im, dm = am;
const b1 = A1, ur = c.forwardRef(({ className: e, ...t }, n) => /* @__PURE__ */ g.jsx(
  j1,
  {
    ref: n,
    className: oe("border-b", e),
    ...t
  }
));
ur.displayName = "AccordionItem";
const cr = c.forwardRef(({ className: e, children: t, ...n }, r) => /* @__PURE__ */ g.jsx(O1, { className: "flex", children: /* @__PURE__ */ g.jsxs(
  cm,
  {
    ref: r,
    className: oe(
      "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
      e
    ),
    ...n,
    children: [
      t,
      /* @__PURE__ */ g.jsx(b0, { className: "h-4 w-4 shrink-0 transition-transform duration-200" })
    ]
  }
) }));
cr.displayName = cm.displayName;
const dr = c.forwardRef(({ className: e, children: t, ...n }, r) => /* @__PURE__ */ g.jsx(
  dm,
  {
    ref: r,
    className: "overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
    ...n,
    children: /* @__PURE__ */ g.jsx("div", { className: oe("pb-4 pt-0", e), children: t })
  }
));
dr.displayName = dm.displayName;
const I1 = ({ isOpen: e, onClose: t, onSave: n, preferences: r }) => {
  const [o, l] = c.useState(r);
  c.useEffect(() => {
    e && l(r);
  }, [e, r]);
  const i = (a) => {
    a !== "necessary" && l((u) => ({ ...u, [a]: !u[a] }));
  }, s = () => {
    n(o), t();
  };
  return /* @__PURE__ */ g.jsx(M0, { open: e, onOpenChange: (a) => !a && t(), children: /* @__PURE__ */ g.jsxs(wp, { className: "sm:max-w-[500px] max-h-[80vh] flex flex-col", children: [
    /* @__PURE__ */ g.jsxs(Sp, { children: [
      /* @__PURE__ */ g.jsx(kp, { children: "Privacy Preferences" }),
      /* @__PURE__ */ g.jsx(Cp, { children: "Customize your consent preferences for cookies and data processing." })
    ] }),
    /* @__PURE__ */ g.jsx(Qp, { className: "flex-1 pr-4", children: /* @__PURE__ */ g.jsxs(b1, { type: "single", collapsible: !0, className: "w-full", children: [
      /* @__PURE__ */ g.jsxs(ur, { value: "necessary", children: [
        /* @__PURE__ */ g.jsx(cr, { className: "hover:no-underline", children: /* @__PURE__ */ g.jsxs("div", { className: "flex items-center justify-between w-full pr-4", children: [
          /* @__PURE__ */ g.jsx("span", { children: "Necessary" }),
          /* @__PURE__ */ g.jsx(ar, { checked: !0, disabled: !0 })
        ] }) }),
        /* @__PURE__ */ g.jsx(dr, { children: "These cookies are essential for the website to function properly and cannot be disabled." })
      ] }),
      /* @__PURE__ */ g.jsxs(ur, { value: "analytics", children: [
        /* @__PURE__ */ g.jsx(cr, { className: "hover:no-underline", children: /* @__PURE__ */ g.jsxs("div", { className: "flex items-center justify-between w-full pr-4", children: [
          /* @__PURE__ */ g.jsx("span", { children: "Analytics" }),
          /* @__PURE__ */ g.jsx(
            ar,
            {
              checked: o.analytics,
              onCheckedChange: () => i("analytics")
            }
          )
        ] }) }),
        /* @__PURE__ */ g.jsx(dr, { children: "Help us understand how visitors interact with the website by collecting and reporting information anonymously." })
      ] }),
      /* @__PURE__ */ g.jsxs(ur, { value: "marketing", children: [
        /* @__PURE__ */ g.jsx(cr, { className: "hover:no-underline", children: /* @__PURE__ */ g.jsxs("div", { className: "flex items-center justify-between w-full pr-4", children: [
          /* @__PURE__ */ g.jsx("span", { children: "Marketing" }),
          /* @__PURE__ */ g.jsx(
            ar,
            {
              checked: o.marketing,
              onCheckedChange: () => i("marketing")
            }
          )
        ] }) }),
        /* @__PURE__ */ g.jsx(dr, { children: "Used to track visitors across websites to display ads that are relevant and engaging." })
      ] }),
      /* @__PURE__ */ g.jsxs(ur, { value: "preferences", children: [
        /* @__PURE__ */ g.jsx(cr, { className: "hover:no-underline", children: /* @__PURE__ */ g.jsxs("div", { className: "flex items-center justify-between w-full pr-4", children: [
          /* @__PURE__ */ g.jsx("span", { children: "Preferences" }),
          /* @__PURE__ */ g.jsx(
            ar,
            {
              checked: o.preferences,
              onCheckedChange: () => i("preferences")
            }
          )
        ] }) }),
        /* @__PURE__ */ g.jsx(dr, { children: "Enable the website to remember information that changes the way the website behaves or looks." })
      ] })
    ] }) }),
    /* @__PURE__ */ g.jsxs(xp, { children: [
      /* @__PURE__ */ g.jsx(en, { variant: "outline", onClick: t, children: "Cancel" }),
      /* @__PURE__ */ g.jsx(en, { onClick: s, children: "Save Preferences" })
    ] })
  ] }) });
}, L1 = ({ onClick: e }) => /* @__PURE__ */ g.jsx("div", { className: "fixed bottom-4 left-4 z-[9990]", children: /* @__PURE__ */ g.jsx(
  en,
  {
    variant: "secondary",
    size: "icon",
    className: "h-12 w-12 rounded-full shadow-lg border-2 border-primary/10 hover:border-primary/50 transition-all hover:scale-110",
    onClick: e,
    children: /* @__PURE__ */ g.jsx(L0, { className: "h-6 w-6 text-primary" })
  }
) }), D1 = {
  necessary: !0,
  analytics: !1,
  marketing: !1,
  preferences: !1
}, z1 = ({ config: e, initialPreferences: t, onUpdate: n }) => {
  const [r, o] = c.useState(t || D1), [l, i] = c.useState(!t), [s, a] = c.useState(!1);
  c.useEffect(() => {
    e != null && e.openBanner && i(!0);
  }, [e]);
  const u = () => {
    const p = { necessary: !0, analytics: !0, marketing: !0, preferences: !0 };
    o(p), n == null || n(p), i(!1);
  }, f = () => {
    const p = { necessary: !0, analytics: !1, marketing: !1, preferences: !1 };
    o(p), n == null || n(p), i(!1);
  }, m = (p) => {
    o(p), n == null || n(p), i(!1), a(!1);
  };
  return /* @__PURE__ */ g.jsxs("div", { className: "cmp-root font-sans text-foreground", children: [
    !l && /* @__PURE__ */ g.jsx(L1, { onClick: () => a(!0) }),
    /* @__PURE__ */ g.jsx(
      Fg,
      {
        isOpen: l,
        onAcceptAll: u,
        onRejectAll: f,
        onManage: () => a(!0),
        config: e
      }
    ),
    /* @__PURE__ */ g.jsx(
      I1,
      {
        isOpen: s,
        onClose: () => a(!1),
        onSave: m,
        preferences: r
      }
    )
  ] });
};
window.CMPUI = {
  mount: (e, t, n) => {
    const r = e.attachShadow({ mode: "open" });
    if (n) {
      const i = document.createElement("link");
      i.rel = "stylesheet", i.href = n, r.appendChild(i);
    }
    const o = document.createElement("div");
    o.id = "cmp-app-root", r.appendChild(o);
    const l = vi.createRoot(o);
    l.render(
      /* @__PURE__ */ g.jsxs(J.StrictMode, { children: [
        /* @__PURE__ */ g.jsx("div", { id: "cmp-portal-container" }),
        /* @__PURE__ */ g.jsx(z1, { ...t })
      ] })
    ), e._reactRoot = l;
  },
  unmount: (e) => {
    const t = e._reactRoot;
    t && t.unmount();
  }
};
