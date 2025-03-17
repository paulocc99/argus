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
    Chip,
    IconButton,
    Tooltip
} from '@mui/material';
import LocalPoliceIcon from '@mui/icons-material/LocalPolice';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import VerifiedIcon from '@mui/icons-material/Verified';
import { WindowsFilled, LinuxOutlined } from '@ant-design/icons';

import { capitalizeWord, eventsNumberPretty } from 'utils';
import SortedTableHead, { stableSort, getComparator } from 'common/SortedTableHead';
import { TableContainerStyle, TableRowStyle, TableStyle } from 'themes/overrides/Table';

const headCells = [
    {
        id: 'name',
        align: 'left',
        disablePadding: true,
        label: 'Name'
    },
    // {
    //     id: 'model',
    //     align: 'left',
    //     disablePadding: false,
    //     label: 'Model'
    // },
    {
        id: 'os',
        align: 'left',
        disablePadding: true,
        label: 'OS'
    },
    // {
    //     id: 'vendor',
    //     align: 'left',
    //     disablePadding: true,
    //     label: 'Vendor'
    // },
    {
        id: 'ip',
        align: 'left',
        disablePadding: true,
        label: 'IP'
    },
    // {
    //     id: 'datasource',
    //     align: 'left',
    //     disablePadding: false,
    //     label: 'Datasources'
    // },
    {
        id: 'managed',
        align: 'left',
        disablePadding: false,
        label: 'Managed'
    },
    {
        id: 'events',
        align: 'left',
        disablePadding: false,
        label: 'Events'
    },
    {
        id: 'alerts',
        align: 'left',
        disablePadding: false,
        label: 'Alerts'
    }
];

const OSBanner = ({ os }) => {
    const osIcon = {
        windows: <WindowsFilled />,
        linux: <LinuxOutlined />
    };

    if (!os) return <></>;
    return (
        <Stack direction="row" spacing={1} alignItems="center">
            {osIcon[os.type]}
            <Typography>
                {capitalizeWord(os.name)} {os.type !== 'windows' && os.version}
            </Typography>
        </Stack>
    );
};

export default function AssetTable(props) {
    const { assets, updateSelected, page, pagesNumber, hChange, validate } = props;

    const [order] = useState('desc');
    const [orderBy] = useState('managed');
    const [selected, setSelected] = useState({});
    const isSelected = (uuid) => selected == uuid;

    const handleValidation = (e, asset) => {
        e.stopPropagation();
        validate(asset);
    };

    return (
        <Box>
            <TableContainer sx={TableContainerStyle}>
                <Table sx={TableStyle}>
                    <SortedTableHead order={order} orderBy={orderBy} headCells={headCells} />
                    <TableBody>
                        {stableSort(assets, getComparator(order, orderBy)).map((asset, index) => {
                            const isItemSelected = isSelected(asset.uuid);
                            const assetTStyle = {
                                bgcolor: asset.validated == false && 'rgba(255, 165, 0, 0.15) !important',
                                ...TableRowStyle
                            };
                            return (
                                <TableRow
                                    hover
                                    sx={assetTStyle}
                                    tabIndex={-1}
                                    key={asset.uuid}
                                    selected={isItemSelected}
                                    onClick={() => {
                                        updateSelected(asset);
                                        setSelected(asset.uuid);
                                    }}
                                >
                                    <TableCell align="left">{asset.name}</TableCell>
                                    <TableCell align="left">
                                        <OSBanner os={asset.os} />
                                    </TableCell>
                                    <TableCell align="left">{asset.ip[0]}</TableCell>
                                    {/*                                    <TableCell align="left" size="small">
                                        {asset.datasource.map((p) => (
                                            <Chip label={capitalizeWord(p)} key={p} sx={{ ml: 1 }} />
                                        ))}
                                    </TableCell>*/}
                                    <TableCell align="left">
                                        {asset.managed ? (
                                            <Chip label="MANAGED" color="primary" />
                                        ) : (
                                            <Chip label="NOT MANAGED" color="primary" variant="outlined" />
                                        )}
                                    </TableCell>
                                    <TableCell align="left">
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <ReceiptLongIcon color="primary" />
                                            <Typography>{eventsNumberPretty(asset.stats.events)}</Typography>
                                        </Stack>
                                    </TableCell>
                                    <TableCell align="left">
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <LocalPoliceIcon color="error" />
                                            <Typography>{asset.stats.alarms}</Typography>
                                            <LocalPoliceIcon color="warning" />
                                            <Typography>{asset.stats.alerts}</Typography>
                                        </Stack>
                                    </TableCell>
                                    {!asset.validated && (
                                        <TableCell align="right">
                                            <IconButton color="primary" aria-label="action" onClick={(e) => handleValidation(e, asset)}>
                                                <Tooltip title="Verify asset" placement="right">
                                                    <VerifiedIcon />
                                                </Tooltip>
                                            </IconButton>
                                        </TableCell>
                                    )}
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
            <Box display="flex" justifyContent="center" alignItems="center" spacing={2}>
                <Pagination sx={{ mt: 1, mb: 1 }} count={pagesNumber} page={page} onChange={hChange} />
            </Box>
        </Box>
    );
}
