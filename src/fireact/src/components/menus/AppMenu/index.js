import React from "react";
import { Link } from "react-router-dom";
import { List, ListItem, ListItemText, ListItemIcon, Divider, Typography } from "@mui/material";
import AppIcon from '@mui/icons-material/Apps';
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import ListAltIcon from '@mui/icons-material/ListAlt';

const AppMenu = () => {
    return (
        <List>
            <Link to="/" style={{textDecoration:'none'}}>
                <ListItem button key="My Accounts">
                    <ListItemIcon><AppIcon /></ListItemIcon>
                    <ListItemText primary={<Typography color="textPrimary">My Accounts</Typography>} />
                </ListItem>
            </Link>
            <Divider />
            <Link to="/user/profile" style={{textDecoration:'none'}}>
                <ListItem button key="Profile">
                    <ListItemIcon><AccountBoxIcon /></ListItemIcon>
                    <ListItemText primary={<Typography color="textPrimary">Profile</Typography>} />
                </ListItem>
            </Link>
            <Link to="/user/log" style={{textDecoration:'none'}}>
                <ListItem button key="Activity Logs">
                    <ListItemIcon><ListAltIcon /></ListItemIcon>
                    <ListItemText primary={<Typography color="textPrimary">Activity Logs</Typography>} />
                </ListItem>
            </Link>
        </List>
    )
}

export default AppMenu;