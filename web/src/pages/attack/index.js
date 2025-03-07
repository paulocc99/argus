import { useState, useEffect } from 'react';

import { Button, Grid, Icon, Stack, Typography, Fab } from '@mui/material';
import RadarIcon from '@mui/icons-material/Radar';
import MultilineChartIcon from '@mui/icons-material/MultilineChart';
import MenuBookIcon from '@mui/icons-material/MenuBook';

import { getATTACKTactics, getStatsAlert } from 'api';
import { setError, capitalizeWord } from 'utils';
import MainCard from 'components/cards/MainCard';
import DonutGraph from 'components/DonutGraph';
import KnowledgeBaseDialog from './KnowledgeBaseDialog';
import ATTACKCard from './AttackCard';

const alertType = ['alert', 'alarm'];
const matrixList = ['ics', 'enterprise'];

const alertStatsPlaceholder = {
    tactic: {
        alert: {
            labels: [],
            values: []
        },
        alarm: {
            labels: [],
            values: []
        }
    },
    technique: {
        alert: {
            labels: [],
            values: []
        },
        alarm: {
            labels: [],
            values: []
        }
    },
    asset: {
        alert: {
            labels: [],
            values: []
        },
        alarm: {
            labels: [],
            values: []
        }
    }
};

const NoDataPlaceholder = () => {
    return (
        <Stack direction="row" justifyContent="center" alignItems="center" sx={{ width: 1, height: '348px' }}>
            <MultilineChartIcon />
            <Typography variant="body1">No data</Typography>
        </Stack>
    );
};

const ATTACK = () => {
    const [matrix, setMatrix] = useState('ics');
    const [attackTTP, setATTACKTTP] = useState([]);
    const [tacticSlot, setTacticSlot] = useState('alert');
    const [techniqueSlot, setTechniqueSlot] = useState('alert');
    const [assetSlot, setAssetSlot] = useState('alert');
    const [alertStats, setAlertStats] = useState(alertStatsPlaceholder);
    const [knowledgeDialog, setKnowledgeDialog] = useState(false);

    // Handlers
    const calculateAllCoverage = () => {
        let techniquesTotal = 0;
        let techniquesCovered = 0;
        attackTTP.forEach((ta) => {
            let techniquesWithRules = ta.techniques.map((t) => t.rules.length > 0).filter((r) => r);
            techniquesCovered += techniquesWithRules.length;
            techniquesTotal += ta.techniques.length;
        });
        return Math.ceil((techniquesCovered / techniquesTotal) * 100);
    };

    const allCoveragePct = calculateAllCoverage();

    // API
    const fetchAlertsByTTPs = async () => {
        try {
            const response = await getStatsAlert();
            const data = response.data;
            let alertData = {
                tactic: {
                    alert: {
                        labels: data.tactic.alert.map((a) => a.tactic),
                        values: data.tactic.alert.map((a) => a.count)
                    },
                    alarm: {
                        labels: data.tactic.alarm.map((a) => a.tactic),
                        values: data.tactic.alarm.map((a) => a.count)
                    }
                },
                technique: {
                    alert: {
                        labels: data.technique.alert.map((a) => a.technique),
                        values: data.technique.alert.map((a) => a.count)
                    },
                    alarm: {
                        labels: data.technique.alarm.map((a) => a.technique),
                        values: data.technique.alarm.map((a) => a.count)
                    }
                },
                asset: {
                    alert: {
                        labels: data.asset.alert.map((a) => a.name),
                        values: data.asset.alert.map((a) => a.count)
                    },
                    alarm: {
                        labels: data.asset.alarm.map((a) => a.name),
                        values: data.asset.alarm.map((a) => a.count)
                    }
                }
            };
            setAlertStats(alertData);
        } catch (error) {
            setError(error, 'Error while retriving alert statistics');
        }
    };

    const fetchATTACKTTPs = async () => {
        try {
            const response = await getATTACKTactics(matrix, true, true);
            const { tactics } = response.data;
            setATTACKTTP(tactics);
        } catch (error) {
            setError(error, "Couldn't retrieve ATT&CK tactics");
        }
    };

    // Hooks
    useEffect(() => {
        fetchAlertsByTTPs();
        fetchATTACKTTPs();
    }, []);

    useEffect(() => {
        fetchATTACKTTPs();
    }, [matrix]);

    return (
        <Grid container rowSpacing={4.5} columnSpacing={2.75} justifyContent="space-between">
            <Grid item sx={{ mb: -2.25 }}>
                <Stack direction="row">
                    <Typography sx={{ mr: 8 }} variant="h4">
                        MITRE ATT&CK Overview
                    </Typography>
                    <Icon sx={{ overflow: 'visible' }}>{<RadarIcon />}</Icon>
                    <Stack direction="row" spacing={2} sx={{ ml: 1, mt: 0.5 }}>
                        <Typography variant="h6" color="textSecondary" sx={{ mt: 0.5 }}>
                            ATT&CK Matrix Coverage:
                        </Typography>
                        <Typography variant="h4" color="inherit">
                            {`${allCoveragePct}%`}
                        </Typography>
                    </Stack>
                </Stack>
            </Grid>
            <Grid item sx={{ mb: -2.25 }}>
                <Stack direction="row" alignItems="end" spacing={0}>
                    {matrixList.map((m) => (
                        <Button
                            size="small"
                            sx={{ ml: 3 }}
                            onClick={() => setMatrix(m)}
                            color={matrix === m ? 'primary' : 'secondary'}
                            variant={matrix === m ? 'outlined' : 'text'}
                        >
                            {m.toUpperCase()}
                        </Button>
                    ))}
                </Stack>
            </Grid>

            <Grid item md={8} sx={{ display: { sm: 'none', md: 'block', lg: 'none' } }} />

            <Grid item xs={12}>
                <Stack direction="row" spacing={2} sx={{ overflow: 'auto', pb: 1 }}>
                    {attackTTP.map((tactic) => (
                        <Grid sx={{ 'min-width': '10%' }}>
                            <ATTACKCard isTactic name={tactic.name.toUpperCase()} id={tactic.shortname} ttps={attackTTP} />
                            <Typography sx={{ ml: 1, mb: 1 }} variant="body2">
                                {tactic.techniques?.length} techniques
                            </Typography>
                            <Stack spacing={1}>
                                {tactic.techniques?.map((technique) => (
                                    <ATTACKCard name={technique.name} rules={technique.rules} />
                                ))}
                            </Stack>
                        </Grid>
                    ))}
                </Stack>
            </Grid>

            <Grid item xs={12} md={5} lg={4}>
                <Grid container alignItems="center" justifyContent="space-between">
                    <Grid item>
                        <Typography variant="h5">{capitalizeWord(tacticSlot)} By Tactic</Typography>
                    </Grid>
                    <Grid item>
                        {alertType.map((t) => (
                            <Button
                                size="small"
                                sx={{ ml: 3 }}
                                onClick={() => setTacticSlot(t)}
                                color={tacticSlot === t ? 'primary' : 'secondary'}
                                variant={tacticSlot === t ? 'outlined' : 'text'}
                            >
                                {capitalizeWord(t)}
                            </Button>
                        ))}
                    </Grid>
                </Grid>
                <MainCard sx={{ mt: 2 }} content={false}>
                    {alertStats?.tactic[tacticSlot]?.values.length > 0 ? (
                        <DonutGraph series={alertStats?.tactic[tacticSlot]?.values} labels={alertStats?.tactic[tacticSlot]?.labels} />
                    ) : (
                        <NoDataPlaceholder />
                    )}
                </MainCard>
            </Grid>
            <Grid item xs={12} md={5} lg={4}>
                <Grid container alignItems="center" justifyContent="space-between">
                    <Grid item>
                        <Typography variant="h5">{capitalizeWord(techniqueSlot)} By Techniques</Typography>
                    </Grid>
                    <Grid item>
                        {alertType.map((t) => (
                            <Button
                                size="small"
                                sx={{ ml: 3 }}
                                onClick={() => setTechniqueSlot(t)}
                                color={techniqueSlot === t ? 'primary' : 'secondary'}
                                variant={techniqueSlot === t ? 'outlined' : 'text'}
                            >
                                {capitalizeWord(t)}
                            </Button>
                        ))}
                    </Grid>
                </Grid>
                <MainCard sx={{ mt: 2 }} content={false}>
                    {alertStats?.technique[techniqueSlot]?.values.length > 0 ? (
                        <DonutGraph
                            series={alertStats?.technique[techniqueSlot]?.values}
                            labels={alertStats?.technique[techniqueSlot]?.labels}
                        />
                    ) : (
                        <NoDataPlaceholder />
                    )}
                </MainCard>
            </Grid>
            <Grid item xs={12} md={5} lg={4}>
                <Grid container alignItems="center" justifyContent="space-between">
                    <Grid item>
                        <Typography variant="h5">{capitalizeWord(assetSlot)} By Assets</Typography>
                    </Grid>
                    <Grid item>
                        {alertType.map((t) => (
                            <Button
                                size="small"
                                sx={{ ml: 3 }}
                                onClick={() => setAssetSlot(t)}
                                color={assetSlot === t ? 'primary' : 'secondary'}
                                variant={assetSlot === t ? 'outlined' : 'text'}
                            >
                                {capitalizeWord(t)}
                            </Button>
                        ))}
                    </Grid>
                </Grid>
                <MainCard sx={{ mt: 2 }} content={false}>
                    {alertStats?.asset[assetSlot]?.values.length > 0 ? (
                        <DonutGraph series={alertStats?.asset[assetSlot]?.values} labels={alertStats?.asset[assetSlot]?.labels} />
                    ) : (
                        <NoDataPlaceholder />
                    )}
                </MainCard>
            </Grid>
            <Fab
                onClick={() => setKnowledgeDialog(true)}
                color="primary"
                sx={{ position: 'fixed', bottom: (theme) => theme.spacing(4), right: (theme) => theme.spacing(4) }}
            >
                <MenuBookIcon />
            </Fab>
            <KnowledgeBaseDialog open={knowledgeDialog} handleClose={() => setKnowledgeDialog(false)} />
        </Grid>
    );
};

export default ATTACK;
