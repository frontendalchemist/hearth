import { CareRecordPage } from "./_components/care-record-page"

export default async function RecipientCareRecordRoute({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <CareRecordPage id={id} />
}
