import { useState } from 'react';

import { Box, Table, TableBody, TableCell, TableContainer, TableRow, Switch } from '@mui/material';

import SortedTableHead, { getComparator, stableSort } from 'common/SortedTableHead';
import { TableContainerStyle, TableRowStyle, TableStyle } from 'themes/overrides/Table';

const headCells = [
    {
        id: 'name',
        align: 'left',
        disablePadding: true,
        label: 'Name'
    },
    {
        id: 'ip',
        align: 'left',
        disablePadding: true,
        label: 'IP'
    },
    {
        id: 'mac',
        align: 'left',
        disablePadding: false,
        label: 'MAC'
    },
    {
        id: 'monitor',
        align: 'left',
        disablePadding: true,
        label: 'Monitor'
    }
];

export default function AssetActiveTable(props) {
    const { assets, active, update } = props;

    const isActive = (uuid) => {
        return active.includes(uuid);
    };

    const [order] = useState('desc');
    const [orderBy] = useState('name');

    return (
        <Box>
            <TableContainer sx={TableContainerStyle}>
                <Table sx={TableStyle}>
                    <SortedTableHead order={order} orderBy={orderBy} headCells={headCells} />
                    <TableBody>
                        {stableSort(assets, getComparator(order, orderBy)).map((asset, index) => {
                            return (
                                <TableRow hover sx={TableRowStyle} tabIndex={-1} key={asset.name}>
                                    <TableCell align="left">{asset.name}</TableCell>
                                    <TableCell align="left">{asset.ip?.join(', ')}</TableCell>
                                    <TableCell align="left">{asset.mac?.map((m) => m.toUpperCase()).join(', ')}</TableCell>
                                    <TableCell align="left">
                                        <Switch
                                            checked={isActive(asset.uuid)}
                                            onChange={(e, state) => update(asset.uuid, state)}
                                            inputProps={{ 'aria-label': 'controlled' }}
                                        />
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}
