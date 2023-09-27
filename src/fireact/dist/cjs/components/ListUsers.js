"use strict";

require("core-js/modules/es.weak-map.js");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ListUsers = void 0;
require("core-js/modules/web.dom-collections.iterator.js");
require("core-js/modules/es.array.sort.js");
var _react = _interopRequireWildcard(require("react"));
var _SubscriptionContext = require("./SubscriptionContext");
var _functions = require("firebase/functions");
var _core = require("@fireactjs/core");
var _material = require("@mui/material");
var _PaginationTable = require("./PaginationTable");
var _UpdateUser = require("./UpdateUser");
var _AddUser = require("./AddUser");
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
const ListUsers = _ref => {
  let {
    loader
  } = _ref;
  const {
    config
  } = (0, _react.useContext)(_core.FireactContext);
  const pathnames = config.pathnames;
  const {
    subscription
  } = (0, _react.useContext)(_SubscriptionContext.SubscriptionContext);
  const subscriptionName = subscription.name ? subscription.name : "";
  const [users, setUsers] = (0, _react.useState)([]);
  const {
    functionsInstance
  } = (0, _react.useContext)(_core.AuthContext);
  const [loaded, setLoaded] = (0, _react.useState)(false);
  const [total, setTotal] = (0, _react.useState)(0);
  const [page, setPage] = (0, _react.useState)(0);
  const [pageSize, setPageSize] = (0, _react.useState)(10);
  const [rows, setRows] = (0, _react.useState)([]);
  const [error, setError] = (0, _react.useState)(null);
  const [selectedUser, setSelectedUser] = (0, _react.useState)(null);
  const [addUserActive, setAddUserActive] = (0, _react.useState)(false);
  const [processing, setProcessing] = (0, _react.useState)(false);
  const reovkeInvite = (0, _react.useCallback)(_ref2 => {
    let {
      inviteId,
      subscriptionId
    } = _ref2;
    setProcessing(true);
    const revokeInvite = (0, _functions.httpsCallable)(functionsInstance, 'fireactjsSaas-revokeInvite');
    revokeInvite({
      subscriptionId: subscriptionId,
      inviteId: inviteId
    }).then(res => {
      setUsers(prevState => prevState.filter(row => {
        return row.id !== inviteId && row.type === 'invite' || row.type === 'user';
      }));
      setProcessing(false);
    });
  }, [functionsInstance]);
  (0, _react.useEffect)(() => {
    setError(null);
    const getSubscriptionUsers = (0, _functions.httpsCallable)(functionsInstance, 'fireactjsSaas-getSubscriptionUsers');
    getSubscriptionUsers({
      subscriptionId: subscription.id
    }).then(result => {
      setTotal(result.data.total);
      result.data.users.sort((a, b) => a.displayName > b.displayName);
      setUsers(result.data.users);
      setLoaded(true);
    }).catch(error => {
      setError(error.message);
      setLoaded(true);
    });
  }, [subscription.id, functionsInstance, pathnames.UpdateUser]);
  (0, _react.useEffect)(() => {
    const startIndex = page * pageSize;
    let records = [];
    for (let i = startIndex; i < users.length; i++) {
      const user = users[i];
      if (i >= startIndex + pageSize) {
        break;
      }
      if (user.type === 'user') {
        user.nameCol = /*#__PURE__*/_react.default.createElement("div", {
          style: {
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap'
          }
        }, /*#__PURE__*/_react.default.createElement(_material.Avatar, {
          alt: user.displayName,
          src: user.photoURL
        }), /*#__PURE__*/_react.default.createElement("strong", {
          style: {
            marginLeft: '15px'
          }
        }, user.displayName));
        user.permissionCol = user.permissions.join(", ");
        if (subscription.ownerId === user.id) {
          user.permissionCol = 'owner';
        }
        user.emailCol = user.email;
        if (subscription.ownerId !== user.id) {
          user.actionCol = /*#__PURE__*/_react.default.createElement(_material.Button, {
            size: "small",
            variant: "outlined",
            disabled: processing,
            onClick: () => setSelectedUser({
              id: user.id,
              email: user.email,
              displayName: user.displayName,
              permissions: user.permissions
            })
          }, "Update");
        }
      }
      if (user.type === 'invite') {
        user.nameCol = /*#__PURE__*/_react.default.createElement("div", {
          style: {
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap'
          }
        }, /*#__PURE__*/_react.default.createElement(_material.Avatar, {
          alt: user.displayName,
          src: user.photoURL
        }), /*#__PURE__*/_react.default.createElement("strong", {
          style: {
            marginLeft: '15px'
          }
        }, user.displayName));
        user.permissionCol = user.permissions.join(", ");
        user.emailCol = user.email;
        user.actionCol = /*#__PURE__*/_react.default.createElement(_material.Button, {
          size: "small",
          variant: "outlined",
          disabled: processing,
          onClick: e => {
            reovkeInvite({
              inviteId: user.id,
              subscriptionId: subscription.id
            });
          }
        }, "Revoke Invite");
      }
      records.push(user);
    }
    if (records.length > 0) {
      setRows(records);
    }
    if (addUserActive === false && selectedUser === null) {
      window.scrollTo(0, 0);
    }
  }, [page, pageSize, users, addUserActive, selectedUser, reovkeInvite, subscription.ownerId, subscription.id, processing]);
  return /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, /*#__PURE__*/_react.default.createElement(_core.SetPageTitle, {
    title: "User List" + (subscriptionName !== "" ? " - " + subscriptionName : "")
  }), loaded ? /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, selectedUser !== null ? /*#__PURE__*/_react.default.createElement(_UpdateUser.UpdateUser, {
    user: selectedUser,
    setSelectedUser: setSelectedUser,
    setUsers: setUsers
  }) : /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, addUserActive ? /*#__PURE__*/_react.default.createElement(_AddUser.AddUser, {
    setAddUserActive: setAddUserActive,
    setUsers: setUsers
  }) : /*#__PURE__*/_react.default.createElement(_material.Container, {
    maxWidth: "lx"
  }, error !== null ? /*#__PURE__*/_react.default.createElement(_material.Alert, {
    severity: "error"
  }, error) : /*#__PURE__*/_react.default.createElement(_material.Paper, null, /*#__PURE__*/_react.default.createElement(_material.Box, {
    p: 2
  }, /*#__PURE__*/_react.default.createElement(_material.Grid, {
    container: true,
    direction: "row",
    justifyContent: "space-between",
    alignItems: "center"
  }, /*#__PURE__*/_react.default.createElement(_material.Grid, {
    item: true
  }, /*#__PURE__*/_react.default.createElement(_material.Typography, {
    component: "h1",
    variant: "h4"
  }, "User List")), /*#__PURE__*/_react.default.createElement(_material.Grid, {
    item: true,
    textAlign: "right"
  }, /*#__PURE__*/_react.default.createElement(_material.Button, {
    variant: "contained",
    onClick: () => setAddUserActive(true)
  }, "Invite User")))), /*#__PURE__*/_react.default.createElement(_material.Box, {
    p: 2
  }, /*#__PURE__*/_react.default.createElement(_PaginationTable.PaginationTable, {
    columns: [{
      name: "Name",
      field: "nameCol",
      style: {
        width: '30%'
      }
    }, {
      name: "Email",
      field: "emailCol",
      style: {
        width: '35%'
      }
    }, {
      name: "Permissions",
      field: "permissionCol",
      style: {
        width: '20%'
      }
    }, {
      name: "Action",
      field: "actionCol",
      style: {
        width: '15%'
      }
    }],
    rows: rows,
    totalRows: total,
    pageSize: pageSize,
    page: page,
    handlePageChane: (e, p) => {
      setPage(p);
    },
    handlePageSizeChange: e => {
      setPage(0);
      setPageSize(e.target.value);
    }
  })))))) : /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, loader));
};
exports.ListUsers = ListUsers;