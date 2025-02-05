import { styled } from '@mui/material/styles';
import { useState } from 'react';

import { Box, Table, TableBody, TableCell, TableContainer, TableRow, Pagination, IconButton, Chip, Tooltip } from '@mui/material';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';

import { capitalizeWord, capitalizeWords, datetimeToStr } from 'utils';
import SortedTableHead, { getComparator, stableSort } from 'common/SortedTableHead';
import { TableContainerStyle, TableStyle, TableRowStyle } from 'themes/overrides/Table';
import { RuleSeverity } from 'common/Status';

const headCells = [
    {
        id: 'date',
        align: 'left',
        disablePadding: true,
        label: 'Date'
    },
    {
        id: 'name',
        align: 'left',
        disablePadding: true,
        label: 'Name'
    },
    {
        id: 'author',
        align: 'left',
        disablePadding: true,
        label: 'Author'
    },
    {
        id: 'datasource',
        align: 'left',
        disablePadding: true,
        label: 'Datasource'
    },
    {
        id: 'severity',
        align: 'left',
        disablePadding: true,
        label: 'Severity'
    },
    {
        id: 'tactics',
        align: 'left',
        disablePadding: true,
        label: 'Tactics'
    },
    {
        id: 'techniques',
        align: 'left',
        disablePadding: true,
        label: 'Techniques'
    }
];

// const FixedTableCell = styled(TableCell)`
//     .MuiTableCell-root {
//         width: 500;
//         max-width: 100;
//         overflow: hidden;
//         text-overflow: ellipsis;
//     }
// `;

const FixedTableCell = styled(TableCell)(({ theme }) => ({
    '& .MuiTableCell-root': {
        width: 200,
        maxWidth: 100,
        overflow: 'hidden',
        textOverflow: 'ellipsis'
    }
}));

const style = {
    maxWidth: 250,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    borderStyle: 'border-box'
};

function RuleExternalTable(props) {
    const { rules, page, pagesNumber, pChange, importRule } = props;
    const [order] = useState('desc');
    const [orderBy] = useState('date');

    const joinList = (list) => {
        return list?.map((e) => capitalizeWords(e)).join(', ');
    };

    return (
        <Box>
            <TableContainer sx={TableContainerStyle}>
                <Table aria-labelledby="tableTitle" sx={TableStyle}>
                    <SortedTableHead order={order} orderBy={orderBy} headCells={headCells} />
                    <TableBody>
                        {stableSort(rules, getComparator(order, orderBy)).map((rule, index) => {
                            if (!rule) return;
                            return (
                                <TableRow hover sx={TableRowStyle} tabIndex={-1} key={rule.name}>
                                    <TableCell align="left">{datetimeToStr(rule.date).split(' ')[0]}</TableCell>
                                    <TableCell align="left">{rule.name}</TableCell>
                                    <Tooltip title={rule.author} placement="right">
                                        <TableCell sx={style} align="left">
                                            {rule.author}
                                        </TableCell>
                                    </Tooltip>
                                    <TableCell align="left">
                                        {rule.datasources.map((d) => (
                                            <Chip label={capitalizeWord(d)} />
                                        ))}
                                    </TableCell>
                                    <TableCell align="left">
                                        <RuleSeverity severity={rule.severity} />
                                    </TableCell>
                                    <FixedTableCell align="left">{rule.tactics?.map((t) => capitalizeWords(t)).join(', ')}</FixedTableCell>
                                    <Tooltip title={joinList(rule.techniques)} placement="right">
                                        <TableCell sx={style} align="left">
                                            {joinList(rule.techniques)}
                                        </TableCell>
                                    </Tooltip>
                                    <TableCell align="right">
                                        <IconButton color="primary" onClick={() => importRule(rule.uuid)}>
                                            <CloudDownloadIcon />
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

export default RuleExternalTable;
