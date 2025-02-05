import { Avatar, Box, ListItemAvatar, ListItemButton, ListItemSecondaryAction, ListItemText, Stack, Typography } from '@mui/material';

import LocalPoliceIcon from '@mui/icons-material/LocalPolice';
import PolicyIcon from '@mui/icons-material/Policy';

import { datetimeToStr } from 'utils';

function AlertSummary(props) {
    const { alert, click } = props;

    const handleAlertBtn = () => {
        click(alert);
    };

    if (!alert) return <></>;

    let name = alert.rule ? alert.rule.name : alert.analytic.name ? alert.analytic.name : alert.custom_msg;

    return (
        <Box onClick={handleAlertBtn}>
            <ListItemButton divider>
                <ListItemAvatar>
                    <Avatar
                        sx={{
                            color: 'primary.main',
                            bgcolor: 'primary.lighter'
                        }}
                    >
                        {alert.origin == 'baseline' ? <PolicyIcon /> : <LocalPoliceIcon />}
                    </Avatar>
                </ListItemAvatar>
                <ListItemText primary={<Typography variant="subtitle1">{name}</Typography>} secondary={datetimeToStr(alert.created_at)} />
                <ListItemSecondaryAction>
                    <Stack alignItems="flex-end">
                        {alert.assets.map((a) => (
                            <Typography key={a} variant="caption" color="secondary" noWrap>
                                {a}
                            </Typography>
                        ))}
                    </Stack>
                </ListItemSecondaryAction>
            </ListItemButton>
        </Box>
    );
}

export default AlertSummary;
