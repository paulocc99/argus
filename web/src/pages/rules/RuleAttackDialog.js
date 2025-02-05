import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid } from '@mui/material';

import AttackTable from './RuleAttackTable';

function RuleATTACKDialog(props) {
    const { open, close, tactics, techniques, updateTactic, updateTechnique, isSelected } = props;

    return (
        <Dialog open={open} onClose={close}>
            <DialogTitle>ATT&CK TTPs</DialogTitle>
            <DialogContent sx={{ minWidth: '750px', minHeight: '250px' }}>
                <Grid container direction="row" justifyContent="left" alignItems="left" sx={{ mt: 1 }}>
                    <Grid item xs={6}>
                        <AttackTable data={tactics} click={updateTactic} isSelected={(id) => isSelected('tactics', id)} />
                    </Grid>
                    <Grid item xs={6}>
                        <AttackTable data={techniques} click={updateTechnique} isSelected={(id) => isSelected('techniques', id)} />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => close()}>Save</Button>
            </DialogActions>
        </Dialog>
    );
}

export default RuleATTACKDialog;
