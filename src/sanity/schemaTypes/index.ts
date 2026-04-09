import { type SchemaTypeDefinition } from 'sanity';

import perguruan from './perguruan';
import news from './news';
import product from './product';
import gallery from './gallery';
import organisasi from './organisasi';

export const schema: { types: SchemaTypeDefinition[] } = {
    types: [perguruan, news, product, gallery, organisasi],
};
