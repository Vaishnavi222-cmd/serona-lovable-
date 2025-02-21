
create or replace function create_user_plan(
  p_user_id uuid,
  p_plan_type text,
  p_amount_paid numeric,
  p_payment_id text,
  p_order_id text
) returns json
language plpgsql
security definer
as $$
declare
  v_plan_record json;
begin
  -- Start transaction
  begin
    -- First, deactivate any existing active plans for the user
    update user_plans
    set status = 'inactive'
    where user_id = p_user_id
    and status = 'active';

    -- Insert new plan
    insert into user_plans (
      user_id,
      plan_type,
      amount_paid,
      status,
      payment_id,
      order_id
    )
    values (
      p_user_id,
      p_plan_type,
      p_amount_paid,
      'active',
      p_payment_id,
      p_order_id
    )
    returning json_build_object(
      'id', id,
      'plan_type', plan_type,
      'start_time', start_time,
      'end_time', end_time,
      'remaining_output_tokens', remaining_output_tokens,
      'remaining_input_tokens', remaining_input_tokens
    ) into v_plan_record;

    return v_plan_record;
  exception
    when others then
      -- Rollback happens automatically
      raise exception 'Failed to create plan: %', SQLERRM;
  end;
end;
$$;

-- Grant execute permission to authenticated users
grant execute on function create_user_plan to authenticated;

-- Add columns to user_plans table if they don't exist
alter table user_plans
add column if not exists payment_id text,
add column if not exists order_id text;
