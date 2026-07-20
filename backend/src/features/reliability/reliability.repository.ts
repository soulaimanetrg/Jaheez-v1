import { supabase } from '../../db/supabase';

export class ReliabilityRepository {
  async createAssessment(row: Record<string, unknown>): Promise<any> {
    const { data, error } = await supabase.from('order_delay_assessments').insert(row).select('*').single();
    if (error) {
      if (error.code === '23505') {
        const { data: existing, error: findError } = await supabase.from('order_delay_assessments')
          .select('*').eq('order_id', row.order_id).eq('segment', row.segment).eq('assessment_version', row.assessment_version).single();
        if (findError) throw new Error(findError.message);
        return existing;
      }
      throw new Error(error.message);
    }
    return data;
  }

  async applyPoints(params: Record<string, unknown>): Promise<any> {
    const { data, error } = await supabase.rpc('apply_reliability_points', params);
    if (error) throw new Error(error.message);
    return data;
  }

  async recordOnTime(subjectType: 'driver' | 'store', subjectId: string, orderId: string, requestId: string): Promise<any> {
    const { data, error } = await supabase.rpc('record_on_time_reliability', {
      p_subject_type: subjectType, p_subject_id: subjectId, p_order_id: orderId, p_request_id: requestId,
    });
    if (error) throw new Error(error.message);
    return data;
  }

  async listDriverEvents(driverId: string): Promise<any[]> {
    const { data, error } = await supabase.from('reliability_point_events').select('*')
      .eq('driver_id', driverId).order('created_at', { ascending: false }).limit(100);
    if (error) throw new Error(error.message);
    return data || [];
  }

  async listAssessments(status?: string): Promise<any[]> {
    let query = supabase.from('order_delay_assessments')
      .select('*, drivers(full_name,phone), stores(name,name_ar)').order('assessed_at', { ascending: false }).limit(200);
    if (status) query = query.eq('status', status);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
  }

  async findAssessment(id: string): Promise<any | null> {
    const { data, error } = await supabase.from('order_delay_assessments').select('*').eq('id', id).maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  }

  async overturnAssessment(id: string): Promise<any> {
    const { data, error } = await supabase.from('order_delay_assessments').update({ status: 'overturned' })
      .eq('id', id).eq('status', 'active').select('*').maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  }
}
