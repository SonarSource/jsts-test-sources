import React from "react";
import { AuthContext } from '../../FirebaseAuth';
import { Avatar, Box, Divider, Grid, List, ListItem, Typography } from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import SendIcon from '@mui/icons-material/Send';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import { useHistory } from "react-router-dom";

const UserProfileView = () => {
    const history = useHistory();

    return (
        <AuthContext.Consumer>
            {(context) => (   
                <List component="nav">
                    <ListItem>
                        <Grid container spacing={1}>
                            <Grid container item xs={12} md={4}>
                                <Box p={2}><strong>AVATAR</strong><br /><Typography color="textSecondary">Update via social login</Typography></Box>
                            </Grid>
                            <Grid container item xs={12} md={4}>
                                <Box p={2}></Box>
                            </Grid>
                            <Grid container item xs={12} md={4}>
                                <Box p={2} style={{marginLeft: "auto", marginRight: "0px",}}>
                                    <Avatar alt={context.authUser.user.displayName} src={context.authUser.user.photoURL} style={{height:'64px',width:'64px'}} />
                                </Box>
                            </Grid>
                        </Grid>
                    </ListItem>
                    <Divider />
                    <ListItem button onClick={() => {
                        history.push('/user/profile/update-name');
                    }}>
                        <Grid container spacing={1}>
                            <Grid container item xs={12} md={4}>
                                <Box p={2}><strong>NAME</strong></Box>
                            </Grid>
                            <Grid container item xs={12} md={4}>
                                <Box p={2}>{context.authUser.user.displayName}</Box>
                            </Grid>
                            <Grid container item xs={12} md={4}>
                                <Box p={2} style={{marginLeft: "auto", marginRight: "0px",}}>
                                    <EditIcon />
                                </Box>
                            </Grid>
                        </Grid>
                    </ListItem>
                    <Divider />
                    <ListItem button onClick={() => {
                        history.push('/user/profile/update-email');
                    }}>
                        <Grid container spacing={1}>
                            <Grid container item xs={12} md={4}>
                                <Box p={2}><strong>EMAIL</strong></Box>
                            </Grid>
                            <Grid container item xs={12} md={4}>
                                <Box p={2}>{context.authUser.user.email}</Box>
                            </Grid>
                            <Grid container item xs={12} md={4}>
                                <Box p={2} style={{marginLeft: "auto", marginRight: "0px",}}>
                                    <EditIcon />
                                </Box>
                            </Grid>
                        </Grid>
                    </ListItem>
                    <Divider />
                    <ListItem button={!context.authUser.user.emailVerified} onClick={() => {
                        if(!context.authUser.user.emailVerified)history.push('/user/profile/verify-email');
                    }}>
                        <Grid container spacing={1}>
                            <Grid container item xs={12} md={4}>
                                <Box p={2}><strong>EMAIL VERIFIED</strong></Box>
                            </Grid>
                            <Grid container item xs={12} md={4}>
                                <Box p={2}>{(context.authUser.user.emailVerified?" Verified":"Unverified email")}</Box>
                            </Grid>
                            <Grid container item xs={12} md={4}>
                                <Box p={2} style={{marginLeft: "auto", marginRight: "0px",}}>
                                    {context.authUser.user.emailVerified?(<VerifiedUserIcon />):(<SendIcon />)}
                                </Box>
                            </Grid>
                        </Grid>
                    </ListItem>
                    <Divider />
                    <ListItem button onClick={() => {
                        history.push('/user/profile/update-phone');
                    }}>
                        <Grid container spacing={1}>
                            <Grid container item xs={12} md={4}>
                                <Box p={2}><strong>PHONE</strong></Box>
                            </Grid>
                            <Grid container item xs={12} md={4}>
                                <Box p={2}>{context.authUser.user.phoneNumber}</Box>
                            </Grid>
                            <Grid container item xs={12} md={4}>
                                <Box p={2} style={{marginLeft: "auto", marginRight: "0px",}}>
                                    <EditIcon />
                                </Box>
                            </Grid>
                        </Grid>
                    </ListItem>
                    <Divider />
                    <ListItem button onClick={() => {
                        history.push('/user/profile/update-password');
                    }}>
                        <Grid container spacing={1}>
                            <Grid container item xs={12} md={4}>
                                <Box p={2}><strong>PASSWORD</strong></Box>
                            </Grid>
                            <Grid container item xs={12} md={4}>
                                <Box p={2}>••••••••</Box>
                            </Grid>
                            <Grid container item xs={12} md={4}>
                                <Box p={2} style={{marginLeft: "auto", marginRight: "0px",}}>
                                    <EditIcon />
                                </Box>
                            </Grid>
                        </Grid>
                    </ListItem>
                    <Divider />
                    <ListItem button onClick={() => {
                        history.push('/user/profile/delete');
                    }}>
                        <Grid container spacing={1}>
                            <Grid container item xs={12} md={4}>
                                <Box p={2}><Typography color="error"><strong>DELETE ACCOUNT</strong></Typography></Box>
                            </Grid>
                        </Grid>
                    </ListItem>
                </List>
            )}
        </AuthContext.Consumer>
    )
}

export default UserProfileView;