create policy "authenticated users can insert cards"
  on public.cards for insert
  with check (auth.role() = 'authenticated');

create policy "authenticated users can update cards"
  on public.cards for update
  using (auth.role() = 'authenticated');
