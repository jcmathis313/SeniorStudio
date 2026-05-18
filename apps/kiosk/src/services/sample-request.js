import { getCommunity } from './auth.js';
import { supabase } from './supabase.js';

export async function submitSampleRequest(userInfo, items) {
  const community = getCommunity();
  if (!community) throw new Error('No community selected');

  let residentId = null;
  try {
    let { data: resident } = await supabase
      .from('residents')
      .select('id')
      .eq('email', userInfo.email.toLowerCase().trim())
      .eq('community_id', community.id)
      .single();

    if (!resident) {
      const { data: newResident, error: insertErr } = await supabase
        .from('residents')
        .insert({
          community_id: community.id,
          email: userInfo.email.toLowerCase().trim(),
          first_name: userInfo.firstName.trim(),
          last_name: userInfo.lastName.trim(),
          phone: userInfo.phone?.trim() || null,
        })
        .select('id')
        .single();

      if (insertErr) throw new Error(insertErr.message);
      resident = newResident;
    }
    residentId = resident.id;
  } catch (err) {
    console.error('Failed to resolve resident:', err);
  }

  const orderItems = items.map((i) => ({
    sku: i.sku,
    name: i.name,
    qty: 1,
    notes: [i.brand, i.categoryLabel].filter(Boolean).join(' — '),
    sampleStatus: i.sampleStatus || '',
    sampleId: i.sampleId || '',
  }));

  const { data, error } = await supabase
    .from('shipping_orders')
    .insert({
      type: 'sample_request',
      status: 'new',
      source_form: 'kiosk',
      community_id: community.id,
      requester: {
        name: `${userInfo.firstName.trim()} ${userInfo.lastName.trim()}`,
        email: userInfo.email.toLowerCase().trim(),
        phone: userInfo.phone?.trim() || null,
        organization: community.name,
        community_id: community.id,
        resident_id: residentId,
      },
      ship_to: userInfo.address ? {
        name: `${userInfo.firstName.trim()} ${userInfo.lastName.trim()}`,
        street1: userInfo.address.street1,
        street2: userInfo.address.street2 || '',
        city: userInfo.address.city,
        state: userInfo.address.state,
        zip: userInfo.address.zip,
        country: 'US',
      } : {},
      items: orderItems,
    })
    .select('id')
    .single();

  if (error) throw new Error(error.message);
  return data;
}
