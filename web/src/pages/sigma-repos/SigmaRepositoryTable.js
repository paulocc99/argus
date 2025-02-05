import { useState } from 'react';

import {
    Box,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableRow,
    Typography,
    Pagination,
    IconButton,
    Chip,
    CircularProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SubdirectoryArrowRightIcon from '@mui/icons-material/SubdirectoryArrowRight';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SyncIcon from '@mui/icons-material/Sync';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';

import { TableContainerStyle, TableStyle, TableRowStyle } from 'themes/overrides/Table';
import SortedTableHead, { getComparator, stableSort } from 'common/SortedTableHead';
import { capitalizeWord, setSuccess, setError } from 'utils';
import { postSigmaRepositoryClear, postSigmaRepositorySync } from 'api';

const headCells = [
    {
        id: 'name',
        align: 'left',
        disablePadding: true,
        label: 'Name'
    },
    {
        id: 'repository',
        align: 'left',
        disablePadding: true,
        label: 'Repository'
    },
    {
        id: 'datasources',
        align: 'left',
        disablePadding: true,
        label: 'Datasources'
    },
    {
        id: 'rules',
        align: 'left',
        disablePadding: true,
        label: 'Rules'
    }
];

export default function SigmaRepositoryTable(props) {
    const { repos, page, pagesNumber, pChange, show, del, refresh } = props;

    const [processing, setProcessing] = useState([]);
    const [order] = useState('asc');
    const [orderBy] = useState('id');
    const [selected, setSelected] = useState('');
    const isSelected = (uuid) => selected == uuid;
    const isProcessing = (uuid) => processing.includes(uuid);

    // Handlers
    const handleClick = (repo) => {
        setSelected(repo.uuid);
        show(repo);
    };

    const handleClear = (e, id) => {
        e.stopPropagation();
        clearSigmaRepo(id);
    };

    const handleSync = (e, id) => {
        e.stopPropagation();
        setProcessing([...processing, id]);
        syncSigmaRepo(id);
    };

    const handleDel = (e, id) => {
        e.stopPropagation();
        del(id);
    };

    // API
    const syncSigmaRepo = async (id) => {
        try {
            await postSigmaRepositorySync(id);
            setSuccess('Repository rules processed.');
            setProcessing([...processing].filter((e) => e != id));
            refresh();
        } catch (error) {
            setError("Couldn't process repository rules", error.message);
        }
    };

    const clearSigmaRepo = async (id) => {
        try {
            await postSigmaRepositoryClear(id);
            setSuccess('Repository rules cleared.');
            refresh();
        } catch (error) {
            setError("Couldn't process repository rules", error.message);
        }
    };

    return (
        <Box>
            <TableContainer sx={TableContainerStyle}>
                <Table sx={TableStyle}>
                    <SortedTableHead order={order} orderBy={orderBy} headCells={headCells} />
                    <TableBody>
                        {stableSort(repos, getComparator(order, orderBy)).map((repo, index) => {
                            const isItemSelected = isSelected(repo.uuid);
                            const isItemProcessing = isProcessing(repo.uuid);

                            return (
                                <TableRow
                                    hover
                                    sx={TableRowStyle}
                                    tabIndex={-1}
                                    key={repo.uuid}
                                    selected={isItemSelected}
                                    onClick={() => handleClick(repo)}
                                >
                                    <TableCell align="left">{repo.name}</TableCell>
                                    <TableCell align="left">{repo.repository}</TableCell>
                                    <TableCell align="right">
                                        {repo.mappings?.map((r) => (
                                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                                                {r.datasources.map((d) => (
                                                    <Chip key={d} label={capitalizeWord(d)} sx={{ ml: 1 }} />
                                                ))}
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <SubdirectoryArrowRightIcon color="primary" />
                                                    <Typography>{r.path}</Typography>
                                                </Stack>
                                            </Stack>
                                        ))}
                                    </TableCell>
                                    <TableCell align="left">
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <AssignmentIcon color="primary" />
                                            <Typography>{repo.count}</Typography>
                                            {isItemProcessing ? (
                                                <CircularProgress size={24} />
                                            ) : (
                                                <IconButton onClick={(e) => handleClear(e, repo.uuid)}>
                                                    <DeleteSweepIcon />
                                                </IconButton>
                                            )}
                                        </Stack>
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton color="primary" onClick={(e) => handleSync(e, repo.uuid)}>
                                            {repo?.processed ? <SyncIcon /> : <PlayArrowIcon />}
                                        </IconButton>
                                        <IconButton color="error" onClick={(e) => handleDel(e, repo.uuid)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
            <Box display="flex" justifyContent="center" alignItems="center" spacing={2}>
                <Pagination sx={{ mt: 1, mb: 1 }} count={pagesNumber} page={page} onChange={pChange} />
            </Box>
        </Box>
    );
}
