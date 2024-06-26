import Header from "@/components/shared/Header";
import TransformationForm from "@/components/shared/TransformationForm";
import { transformationTypes } from "@/constants";
import { getUserById } from "@/lib/actions/user.action";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

const AddTransformationType = async ({
  params: { type },
}: SearchParamProps) => {
  const { userId } = auth();
  if (!userId) redirect("sign-in");
  const user = await getUserById(userId);
  //here we are getting the currently logged in user's database id from provideing th clerk's userId to access the database's id and to know which user has logged in
  const transformation = transformationTypes[type];
  return (
    <>
      <Header title={transformation.title} subtitle={transformation.subTitle} />
      <section className="mt-10">
        <TransformationForm
          action="Add"
          userId={user._id}
          type={transformation.type as TransformationTypeKey}
          creditBalance={user.creditBalance}
        />
      </section>
    </>
  );
};

export default AddTransformationType;
