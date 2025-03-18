import { Stack, Typography, Link, Paper, Tooltip } from '@mui/material';
import Vertical from 'components/@extended/Vertical';

const coverageColor = (percentage) => {
    if (percentage == 100) return 'success';
    if (percentage > 0) return 'warning';
    return 'error';
};

const calculateTacticCoverage = (ttps, tacticID) => {
    if (ttps.length == 0) return 0;
    let tactic = ttps.find((t) => t.shortname == tacticID);
    if (!tactic) return 0;
    let techniquesWithRules = tactic.techniques.map((t) => t.rules.length > 0).filter((r) => r);
    return (techniquesWithRules.length / tactic.techniques.length) * 100;
};

function TTPTooltip(props) {
    const { rules } = props;
    if (rules.length == 0) {
        return <></>;
    }
    return (
        <>
            <Typography color="inherit">Rules</Typography>
            <ul>
                {rules &&
                    rules.length > 0 &&
                    rules.map((r) => (
                        <li>
                            <Link href={`/rules/${r.uuid}`}>{r.name}</Link>
                        </li>
                    ))}
            </ul>
        </>
    );
}

export default function ATTACKCard(props) {
    const { id, name, isTactic, rules, ttps } = props;

    const coverage = isTactic && calculateTacticCoverage(ttps, id);
    const color = isTactic ? coverageColor(coverage) : rules.length > 0 && 'success';
    const opacity = isTactic || rules.length > 0 ? '100%' : '70%';
    const variant = isTactic || rules.length > 0 ? 'elevation' : 'outlined';

    return (
        <Paper sx={{ height: '55px', opacity: opacity, cursor: 'pointer' }} variant={variant}>
            <Tooltip title={<TTPTooltip rules={isTactic ? [] : rules} />}>
                <Stack direction="row">
                    {(coverage >= 0 || rules?.length > 0) && <Vertical color={color} height={55} border={'0%'} />}
                    <Stack spacing={0.5} sx={{ mt: 1, ml: 1, mr: 1 }}>
                        <Typography variant={isTactic ? 'h5' : 'h6'} color="inherit" sx={{ fontSize: '0.75rem' }}>
                            {name}
                        </Typography>
                    </Stack>
                </Stack>
            </Tooltip>
        </Paper>
    );
}
