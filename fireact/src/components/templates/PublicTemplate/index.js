import React from "react";
import { Box, Container } from "@mui/material"

const PublicTemplate = ({ children }) => {
    return (
		<Box m={10}>
			<Container maxWidth="sm">
				<Box component="span" m={5} textAlign="center">
					{children}
				</Box>
			</Container>
		</Box>
    )
}

export default PublicTemplate;