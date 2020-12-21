import expressPromiseRouter from 'express-promise-router';
import { siteMetrics } from '../../..';
import { SiteMetric } from '../../../metrics/types';

const router = expressPromiseRouter();

router.get('/', async (req, res) => {
	const siteMetricArray: SiteMetric[] = await siteMetrics.get();

	res.json({ error: false, siteMetrics: siteMetricArray });
});

export default router;
