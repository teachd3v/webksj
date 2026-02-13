import { type SchemaTypeDefinition } from 'sanity';

import perguruan from './perguruan';
import news from './news';
import product from './product';
import gallery from './gallery';
import statsSettings from './statsSettings';
import organisasi from './organisasi';
import siteSettings from './siteSettings';

export const schema: { types: SchemaTypeDefinition[] } = {
    types: [perguruan, news, product, gallery, statsSettings, organisasi, siteSettings],
};
