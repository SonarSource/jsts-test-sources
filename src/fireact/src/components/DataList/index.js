import React, { useState, useEffect, useRef } from 'react';
import { Paper, Box, Stack, Alert } from '@mui/material';
import DataTable from '../DataTable';
import Loader from '../Loader';

const DataList = ({handleFetch, schema}) => {
    const mountedRef = useRef(true);
    const [rows, setRows] = useState([]);
    const [total, setTotal] = useState(-1);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        setIsLoading(true);
        handleFetch(page, pageSize).then(
            res => {
                if (!mountedRef.current) return null
                setRows(res.data);
                setTotal(res.total);
                setIsLoading(false);
            }
        )
    },[handleFetch, page, pageSize]);

    useEffect(() => {
        return () => { 
            mountedRef.current = false
        }
    },[]);

    return (
        <>
            {isLoading?(
                <Paper>
                    <Box p={2}>
                        <Loader text="Loading..." />
                    </Box>
                </Paper>
            ):(
                <Stack spacing={3}>
                {rows.length === 0 &&
                    <Alert severity="error">No data is found.</Alert>
                }
                    <Paper>
                        <Box>
                            <DataTable
                                columns={schema}
                                rows = {rows}
                                totalRows = {total}
                                pageSize = {pageSize}
                                page={page}
                                handlePageChane = {(e, p) => {
                                    setPage(p);
                                }}
                                handlePageSizeChange = {(e) => {
                                    setPage(0);
                                    setPageSize(e.target.value);
                                }}
                            />
                            
                        </Box>
                    </Paper>
                </Stack>
            )}
        </>
    )
}

export default DataList;