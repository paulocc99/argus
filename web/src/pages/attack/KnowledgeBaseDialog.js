import { useState, useEffect } from 'react';
import Markdown from 'react-markdown';

import { Box, Stack, Typography, Dialog, DialogContent, Tabs, Tab, FormControl, Grid, Link } from '@mui/material';

import { getATTACKTactics, getATTACKDatasources, getATTACKGroups, getATTACKSoftware } from 'api';
import DynamicTable from 'components/DynamicTable';
import { TabPanel, a11yProps } from 'common/TabPanel';
import { setError } from 'utils';
import AttackTable from './RuleAttackTable';

const NoDataPlaceholder = () => {
    return (
        <Stack direction="row" justifyContent="center" alignItems="center" sx={{ width: 1, height: '348px' }}>
            <Typography variant="body1">No data</Typography>
        </Stack>
    );
};

export default function KnowledgeBaseDialog(props) {
    const { open, handleClose } = props;

    const [tab, setTab] = useState(0);

    const [tactics, setTactics] = useState([]);
    const [selTactic, setSelTactic] = useState({});
    const [selTechnique, setSelTechnique] = useState({});
    const [selType, setSelType] = useState('tactic');

    const [datasources, setDatasources] = useState([]);
    const [selDatasource, setSelDatasource] = useState({});

    const [groups, setGroups] = useState([]);
    const [selGroup, setSelGroup] = useState({});

    const [software, setSoftware] = useState([]);
    const [selSoftware, setSelSoftware] = useState({});

    // Handlers
    const isSelected = (type, id) => {
        if (type == 'tactic') return selTactic.id == id;
        if (type == 'technique') return selTechnique.id == id;
    };

    const handleTabChange = (event, newValue) => {
        setTab(newValue);
    };

    // API
    const fetchATTACKTactics = async () => {
        try {
            const response = await getATTACKTactics('ics', true);
            setTactics(response.data.tactics);
        } catch (error) {
            setError(error, "Couldn't load ATT&CK tactics and techniques.");
        }
    };

    const fetchATTACKDatasources = async () => {
        try {
            const response = await getATTACKDatasources('ics', true);
            setDatasources(response.data.datasources);
        } catch (error) {
            setError(error, "Couldn't load ATT&CK datasources.");
        }
    };

    const fetchATTACKGroups = async () => {
        try {
            const response = await getATTACKGroups('ics', true);
            setGroups(response.data.groups);
        } catch (error) {
            setError(error, "Couldn't load ATT&CK groups.");
        }
    };

    const fetchATTACKSoftware = async () => {
        try {
            const response = await getATTACKSoftware('ics', true);
            setSoftware(response.data.software);
        } catch (error) {
            setError(error, "Couldn't load ATT&CK software.");
        }
    };

    // Hooks
    useEffect(() => {
        if (!open) return;
        fetchATTACKTactics();
    }, [open]);

    useEffect(() => {
        if (tab == 1 && datasources.length == 0) fetchATTACKDatasources();
        if (tab == 2 && groups.length == 0) fetchATTACKGroups();
        if (tab == 3 && software.length == 0) fetchATTACKSoftware();
    }, [tab]);

    const TacticView = (props) => {
        const { tactic } = props;
        if (Object.keys(tactic).length === 0) return <NoDataPlaceholder />;

        return (
            <>
                <FormControl fullWidth>
                    <Typography variant="h5" sx={{ fontSize: '1rem' }}>
                        Description
                    </Typography>
                    <Typography variant="body1" sx={{ fontSize: '0.9rem' }}>
                        {tactic?.description}
                    </Typography>
                </FormControl>
                <FormControl fullWidth sx={{ mt: 1 }}>
                    <Typography variant="h5" sx={{ fontSize: '1rem' }}>
                        URL
                    </Typography>
                    <Typography variant="body1" sx={{ fontSize: '0.8rem' }}>
                        <Link href={tactic.url}>Offical MITRE ATT&CK</Link>
                    </Typography>
                </FormControl>
            </>
        );
    };

    const TechniqueView = (props) => {
        const { technique } = props;
        if (Object.keys(technique).length === 0) return <NoDataPlaceholder />;

        const detections = technique?.detections?.map((s) => ['name', 'description'].map((e) => s[e]));
        const mitigations = technique?.mitigations?.map((s) => ['id', 'name'].map((e) => s[e]));
        return (
            <>
                <FormControl fullWidth sx={{ mb: 2 }}>
                    <Typography variant="h5" sx={{ fontSize: '1rem' }}>
                        Description
                    </Typography>
                    <Markdown>{technique?.description}</Markdown>
                </FormControl>
                <FormControl fullWidth sx={{ mb: 2 }}>
                    <Typography variant="h5" sx={{ fontSize: '1rem' }}>
                        URL
                    </Typography>
                    <Typography variant="body1" sx={{ fontSize: '0.8rem' }}>
                        <Link href={technique.url}>Offical MITRE ATT&CK</Link>
                    </Typography>
                </FormControl>
                {detections && detections.length > 0 && (
                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <Typography variant="h5" sx={{ fontSize: '1rem' }}>
                            Detections
                        </Typography>
                        <DynamicTable data={detections} cells={['name', 'description']} />
                    </FormControl>
                )}
                {mitigations && mitigations.length > 0 && (
                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <Typography variant="h5" sx={{ fontSize: '1rem' }}>
                            Mitigations
                        </Typography>
                        <DynamicTable data={mitigations} cells={['id', 'name']} />
                    </FormControl>
                )}
            </>
        );
    };

    const DatasourceView = (props) => {
        const { ds } = props;
        if (Object.keys(ds).length === 0) return <NoDataPlaceholder />;

        return (
            <>
                <FormControl fullWidth sx={{ mb: 1.5 }}>
                    <Typography variant="h5" sx={{ fontSize: '1rem' }}>
                        Supported Platforms
                    </Typography>
                    <Typography variant="body1" sx={{ fontSize: '0.9rem' }}>
                        {ds?.platforms?.join(', ')}
                    </Typography>
                </FormControl>
                <FormControl fullWidth sx={{ mb: 1.5 }}>
                    <Typography variant="h5" sx={{ fontSize: '1rem' }}>
                        Where to Collect
                    </Typography>
                    <Typography variant="body1" sx={{ fontSize: '0.9rem' }}>
                        {ds?.collection?.join(', ')}
                    </Typography>
                </FormControl>
                <FormControl fullWidth sx={{ mb: 1.5 }}>
                    <Typography variant="h5" sx={{ fontSize: '1rem' }}>
                        Description
                    </Typography>
                    <Typography variant="body1" sx={{ fontSize: '0.9rem' }}>
                        {ds?.description}
                    </Typography>
                </FormControl>
                <FormControl fullWidth>
                    <Typography variant="h5" sx={{ fontSize: '1rem' }}>
                        URL
                    </Typography>
                    <Typography variant="body1" sx={{ fontSize: '0.8rem' }}>
                        <Link href={ds.url}>Offical MITRE ATT&CK</Link>
                    </Typography>
                </FormControl>
            </>
        );
    };

    const GroupView = (props) => {
        const { group } = props;
        if (Object.keys(group).length === 0) return <NoDataPlaceholder />;

        const cells = ['id', 'name', 'platform'];
        const software = group?.software?.map((s) => cells.map((e) => s[e]));
        const groupTechniques = group?.techniques?.map((s) => ['id', 'name'].map((e) => s[e]));
        return (
            <>
                <FormControl fullWidth sx={{ mb: 2 }}>
                    <Typography variant="h5" sx={{ fontSize: '1rem' }}>
                        Aliases
                    </Typography>
                    <Typography variant="body1" sx={{ fontSize: '0.9rem' }}>
                        {group?.aliases?.join(', ')}
                    </Typography>
                </FormControl>
                <FormControl fullWidth sx={{ mb: 2 }}>
                    <Typography variant="h5" sx={{ fontSize: '1rem' }}>
                        Description
                    </Typography>
                    <Markdown>{group?.description}</Markdown>
                </FormControl>
                <FormControl fullWidth sx={{ mb: 2 }}>
                    <Typography variant="h5" sx={{ fontSize: '1rem' }}>
                        URL
                    </Typography>
                    <Typography variant="body1" sx={{ fontSize: '0.8rem' }}>
                        <Link href={group?.url}>Offical MITRE ATT&CK</Link>
                    </Typography>
                </FormControl>
                {groupTechniques && groupTechniques.length > 0 && (
                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <Typography variant="h5" sx={{ fontSize: '1rem' }}>
                            Techniques
                        </Typography>
                        <DynamicTable data={groupTechniques} cells={['id', 'name']} />
                    </FormControl>
                )}
                {software && software.length > 0 && (
                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <Typography variant="h5" sx={{ fontSize: '1rem' }}>
                            Software
                        </Typography>
                        <DynamicTable data={software} cells={cells} />
                    </FormControl>
                )}
            </>
        );
    };

    const SoftwareView = (props) => {
        const { software } = props;
        if (Object.keys(software).length === 0) return <NoDataPlaceholder />;

        const cells = ['id', 'name'];
        const groupTechniques = software?.techniques?.map((s) => cells.map((e) => s[e]));
        const softwareGroups = software?.groups?.map((s) =>
            ['id', 'name', 'aliases'].map((e) => {
                if (e == 'aliases') return s[e].join(', ');
                return s[e];
            })
        );

        return (
            <>
                <FormControl fullWidth sx={{ mb: 2 }}>
                    <Typography variant="h4">{software?.name}</Typography>
                </FormControl>
                <FormControl fullWidth sx={{ mb: 1.5 }}>
                    <Typography variant="h5" sx={{ fontSize: '1rem' }}>
                        Supported Platforms
                    </Typography>
                    <Typography variant="body1" sx={{ fontSize: '0.9rem' }}>
                        {software?.platforms?.join(', ')}
                    </Typography>
                </FormControl>
                <FormControl fullWidth sx={{ mb: 2 }}>
                    <Typography variant="h5" sx={{ fontSize: '1rem' }}>
                        Description
                    </Typography>
                    <Markdown>{software?.description}</Markdown>
                </FormControl>
                <FormControl fullWidth sx={{ mb: 2 }}>
                    <Typography variant="h5" sx={{ fontSize: '1rem' }}>
                        URL
                    </Typography>
                    <Typography variant="body1" sx={{ fontSize: '0.8rem' }}>
                        <Link href={software?.url}>Offical MITRE ATT&CK</Link>
                    </Typography>
                </FormControl>
                {groupTechniques && groupTechniques.length > 0 && (
                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <Typography variant="h5" sx={{ fontSize: '1rem' }}>
                            Techniques
                        </Typography>
                        <DynamicTable data={groupTechniques} cells={cells} />
                    </FormControl>
                )}
                {softwareGroups && softwareGroups.length > 0 && (
                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <Typography variant="h5" sx={{ fontSize: '1rem' }}>
                            Used by groups
                        </Typography>
                        <DynamicTable data={softwareGroups} cells={['id', 'name', 'aliases']} />
                    </FormControl>
                )}
            </>
        );
    };

    return (
        <Dialog open={open} onClose={handleClose} minWidth={1200} maxWidth={1500}>
            <DialogContent sx={{ minWidth: '1200px', minHeight: '600px', maxWidth: '1500px' }}>
                <Box sx={{ borderBottom: 0, borderColor: 'divider' }}>
                    <Tabs value={tab} onChange={handleTabChange}>
                        <Tab label="Tactics & Techniques" {...a11yProps(0)} />
                        <Tab label="Data sources" {...a11yProps(1)} />
                        <Tab label="Groups" {...a11yProps(2)} />
                        <Tab label="Software" {...a11yProps(3)} />
                    </Tabs>
                </Box>
                <TabPanel value={tab} index={0}>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={3}>
                            <AttackTable
                                type="tactic"
                                data={tactics}
                                click={(t) => {
                                    setSelTactic(t);
                                    setSelType('tactic');
                                }}
                                isSelected={(id) => isSelected('tactic', id)}
                            />
                        </Grid>
                        <Grid item xs={selType == 'tactic' ? 3 : 3}>
                            {selTactic.techniques && (
                                <AttackTable
                                    type="technique"
                                    data={selTactic?.techniques}
                                    click={(t) => {
                                        setSelTechnique(t);
                                        setSelType('technique');
                                    }}
                                    isSelected={(id) => isSelected('technique', id)}
                                />
                            )}
                        </Grid>
                        <Grid item xs={5}>
                            {selType == 'tactic' ? <TacticView tactic={selTactic} /> : <TechniqueView technique={selTechnique} />}
                        </Grid>
                    </Grid>
                </TabPanel>
                <TabPanel value={tab} index={1}>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={4}>
                            {datasources.length > 0 && (
                                <AttackTable
                                    type="datasource"
                                    data={datasources}
                                    click={(ds) => {
                                        setSelDatasource(ds);
                                    }}
                                    isSelected={(id) => selDatasource.id == id}
                                />
                            )}
                        </Grid>
                        <Grid item xs={7}>
                            <DatasourceView ds={selDatasource} />
                        </Grid>
                    </Grid>
                </TabPanel>
                <TabPanel value={tab} index={2}>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={4}>
                            {groups.length > 0 && (
                                <AttackTable
                                    type="group"
                                    data={groups}
                                    click={(g) => {
                                        setSelGroup(g);
                                    }}
                                    isSelected={(id) => setSelGroup.id == id}
                                />
                            )}
                        </Grid>
                        <Grid item xs={7}>
                            <GroupView group={selGroup} />
                        </Grid>
                    </Grid>
                </TabPanel>
                <TabPanel value={tab} index={3}>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={4}>
                            {software.length > 0 && (
                                <AttackTable
                                    type="software"
                                    data={software}
                                    click={(g) => {
                                        setSelSoftware(g);
                                    }}
                                    isSelected={(id) => setSelSoftware.id == id}
                                />
                            )}
                        </Grid>
                        <Grid item xs={7}>
                            <SoftwareView software={selSoftware} />
                        </Grid>
                    </Grid>
                </TabPanel>
            </DialogContent>
        </Dialog>
    );
}
