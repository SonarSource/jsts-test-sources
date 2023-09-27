"use strict";

require("core-js/modules/es.weak-map.js");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CreateSubscription = void 0;
require("core-js/modules/web.dom-collections.iterator.js");
require("core-js/modules/es.regexp.exec.js");
require("core-js/modules/es.string.replace.js");
var _core = require("@fireactjs/core");
var _material = require("@mui/material");
var _react = _interopRequireWildcard(require("react"));
var _PricingPlans = require("./PricingPlans");
var _functions = require("firebase/functions");
var _PaymentMethodForm = require("./PaymentMethodForm");
var _reactRouterDom = require("react-router-dom");
var _auth = require("firebase/auth");
var _firestore = require("firebase/firestore");
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
const CreateSubscription = () => {
  const {
    config
  } = (0, _react.useContext)(_core.FireactContext);
  const {
    firestoreInstance,
    functionsInstance
  } = (0, _react.useContext)(_core.AuthContext);
  const [processing, setProcessing] = (0, _react.useState)(false);
  const [error, setError] = (0, _react.useState)(null);
  const [showPaymentMethod, setShowPaymentMethod] = (0, _react.useState)(false);
  const [selectedPlan, setSelectedPlan] = (0, _react.useState)(null);
  const singular = config.saas.subscription.singular;
  const auth = (0, _auth.getAuth)();
  const navigate = (0, _reactRouterDom.useNavigate)();
  const selectPlan = plan => {
    setProcessing(true);
    setError(null);
    if (plan.free) {
      // subscribe to free plans on selection
      const createSubscription = (0, _functions.httpsCallable)(functionsInstance, 'fireactjsSaas-createSubscription');
      createSubscription({
        planId: plan.id,
        paymentMethodId: null
      }).then(res => {
        if (res.data && res.data.subscriptionId) {
          navigate(config.pathnames.Settings.replace(":subscriptionId", res.data.subscriptionId));
        } else {
          setError("Failed to create the " + singular + ".");
          setProcessing(false);
        }
      }).catch(error => {
        setError(error.message);
        setProcessing(false);
      });
    } else {
      // show payment method
      setSelectedPlan(plan);
      setShowPaymentMethod(true);
      setProcessing(false);
    }
  };
  const submitPlan = paymentMethod => {
    setProcessing(true);
    setError(null);
    const createSubscription = (0, _functions.httpsCallable)(functionsInstance, 'fireactjsSaas-createSubscription');
    let subscriptionId = null;
    createSubscription({
      paymentMethodId: paymentMethod.id,
      planId: selectedPlan.id
    }).then(res => {
      if (res.data && res.data.subscriptionId) {
        subscriptionId = res.data.subscriptionId;
      }
      const pmRef = (0, _firestore.doc)(firestoreInstance, 'users/' + auth.currentUser.uid + '/paymentMethods/' + paymentMethod.id);
      return (0, _firestore.setDoc)(pmRef, {
        type: paymentMethod.type,
        cardBrand: paymentMethod.card.brand,
        cardExpMonth: paymentMethod.card.exp_month,
        cardExpYear: paymentMethod.card.exp_year,
        cardLast4: paymentMethod.card.last4
      }, {
        merge: true
      });
    }).then(() => {
      if (subscriptionId !== null) {
        navigate(config.pathnames.Settings.replace(":subscriptionId", subscriptionId));
      } else {
        setError("Failed to create the " + singular + ".");
        setProcessing(false);
      }
    }).catch(err => {
      setError(err.message);
      setProcessing(false);
    });
  };
  return /*#__PURE__*/_react.default.createElement(_material.Container, {
    maxWidth: "lg"
  }, /*#__PURE__*/_react.default.createElement(_core.SetPageTitle, {
    title: "Choose a Plan"
  }), /*#__PURE__*/_react.default.createElement(_material.Paper, null, /*#__PURE__*/_react.default.createElement(_material.Box, {
    p: 5
  }, showPaymentMethod ? /*#__PURE__*/_react.default.createElement(_material.Stack, {
    spacing: 3
  }, /*#__PURE__*/_react.default.createElement(_material.Typography, {
    component: "h1",
    variant: "h3",
    align: "center",
    color: "text.primary",
    gutterBottom: true
  }, "Setup Payment Method"), error !== null && /*#__PURE__*/_react.default.createElement(_material.Alert, {
    severity: "error"
  }, error), /*#__PURE__*/_react.default.createElement(_PaymentMethodForm.PaymentMethodForm, {
    buttonText: "Submit",
    setPaymentMethod: submitPlan,
    disabled: processing
  })) : /*#__PURE__*/_react.default.createElement(_material.Stack, {
    spacing: 3
  }, /*#__PURE__*/_react.default.createElement(_material.Typography, {
    component: "h1",
    variant: "h3",
    align: "center",
    color: "text.primary",
    gutterBottom: true
  }, "Choose a Plan"), error !== null && /*#__PURE__*/_react.default.createElement(_material.Alert, {
    severity: "error"
  }, error), /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement(_PricingPlans.PricingPlans, {
    selectPlan: selectPlan,
    disabled: processing
  }))))));
};
exports.CreateSubscription = CreateSubscription;