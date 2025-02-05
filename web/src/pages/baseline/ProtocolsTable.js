import { useState } from 'react';

import { Box, Table, TableBody, TableCell, TableContainer, TableRow, Chip, Checkbox } from '@mui/material';

import SortedTableHead, { getComparator, stableSort } from 'common/SortedTableHead';
import { TableContainerStyle, TableRowStyle, TableStyle } from '../../themes/overrides/Table';

const headCells = [
    {
        id: 'monitor',
        align: 'left',
        disablePadding: true,
        label: 'Monitor'
    },
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
        id: 'protocols',
        align: 'left',
        disablePadding: false,
        label: 'Protocols'
    }
];

function ProtocolData(props) {
    const { protocols } = props;

    if (Array.isArray(protocols)) {
        return protocols.map((p) => <Chip label={p.toUpperCase()} sx={{ ml: 1 }} />);
    } else {
        return Object.entries(protocols).map((p) => {
            const [prot, ports] = p;
            const label = `${prot.toUpperCase()} (${ports.join(', ')})`;
            return <Chip label={label} sx={{ ml: 1 }} />;
        });
    }
}

export default function ProtocolsTable(props) {
    const { assets } = props;
    const [order] = useState('desc');
    const [orderBy] = useState('name');

    console.log(assets);

    return (
        <Box>
            <TableContainer sx={TableContainerStyle}>
                <Table sx={TableStyle}>
                    <SortedTableHead order={order} orderBy={orderBy} headCells={headCells} />
                    <TableBody>
                        {stableSort(assets, getComparator(order, orderBy)).map((asset, index) => {
                            return (
                                <TableRow hover sx={TableRowStyle} tabIndex={-1} key={asset.name}>
                                    <TableCell align="left">
                                        <Checkbox checked={asset.active} />
                                    </TableCell>
                                    <TableCell align="left">{asset.name}</TableCell>
                                    <TableCell align="left">{asset.ip.join(', ')}</TableCell>
                                    <TableCell align="left">{asset.mac.join(', ')}</TableCell>
                                    <TableCell align="left" size="small">
                                        <ProtocolData protocols={asset.protocols} />
                                    </TableCell>
                                    <TableCell align="right"></TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}
