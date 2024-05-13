"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "../database/mongoose";
import { handleError } from "../utils";
import User from "../database/models/user.model";
import Image from "../database/models/image.model";
import { redirect } from "next/navigation";
import { v2 as cloudinary } from "cloudinary";

const populateUser = (query: any) =>
  query.populate({
    path: "author",
    model: User,
    select: "_id firstName lastName clerkId",
  });

//  ADD IMAGE

export const addImage = async ({ image, userId, path }: AddImageParams) => {
  try {
    await connectToDatabase();
    const author = await User.findById(userId);
    console.log("author for the image to add", author);
    if (!author) {
      throw new Error("User not found in database!");
    }
    const newImage = await Image.create({ ...image, author: author._id });
    revalidatePath(path);
    // it shows the newly added image without storing it to cache

    return JSON.parse(JSON.stringify(newImage));
  } catch (error) {
    handleError(error);
  }
};

//  UPDATE IMAGE

export const updateImage = async ({
  image,
  userId,
  path,
}: UpdateImageParams) => {
  try {
    await connectToDatabase();
    const imageToUpdate = await Image.findById(image._id);
    if (!imageToUpdate || imageToUpdate.author.toHexString() !== userId) {
      throw new Error("Unauthorized or image not found !");
    }
    const updatedImage = await Image.findByIdAndUpdate(
      imageToUpdate._id,
      image,
      { new: true }
    );
    revalidatePath(path);
    // it shows the newly added image without storing it to cache
    return JSON.parse(JSON.stringify(updatedImage));
  } catch (error) {
    handleError(error);
  }
};

// DELETE Image

export const deleteImage = async (imageId: string) => {
  try {
    await connectToDatabase();
    await Image.findByIdAndDelete(imageId);
  } catch (error) {
    handleError(error);
  } finally {
    redirect("/");
  }
};

// get image by id

export const getImageById = async (imageId: string) => {
  try {
    await connectToDatabase();
    const image = await populateUser(Image.findById(imageId));
    if (!image) throw new Error("Image not found!");
    return JSON.parse(JSON.stringify(image));
  } catch (error) {
    handleError(error);
  }
};
// get all image by id

export const getAllImages = async ({
  limit = 9,
  page = 1,
  searchQuery = "",
}: {
  limit?: number;
  page: number;
  searchQuery?: string;
}) => {
  try {
    await connectToDatabase();
    cloudinary.config({
      cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    let expression = "folder=amazeai";
    if (searchQuery) {
      expression += `AND ${searchQuery}`;
    }
    // getting back the images from cloudinary
    const { resources } = await cloudinary.search
      .expression(expression)
      .execute();
    console.log("resources", resources);
    const resourceIds = resources.map((resource: any) => resource.public_id);
    let query = {};
    if (searchQuery) {
      query = {
        // $in means included
        publicId: { $in: resourceIds },
      };
    }
    const skipAmount = Number(page - 1) * limit;
    const images = await populateUser(Image.find(query))
      .sort({
        // so the newer ones will be shown at top
        updatedAt: -1,
      })
      .skip(skipAmount)
      .limit(limit);
    const totalImages = await Image.find(query).countDocuments();
    // shows all images in general
    const savedImages = await Image.find().countDocuments();
    console.log("saved images", { images, totalImages, savedImages });
    return {
      data: JSON.parse(JSON.stringify(images)),
      totalPage: Math.ceil(totalImages / limit),
      savedImages,
    };
  } catch (error) {
    handleError(error);
  }
};

// GET IMAGES BY USER
export async function getUserImages({
  limit = 9,
  page = 1,
  userId,
}: {
  limit?: number;
  page: number;
  userId: string;
}) {
  try {
    await connectToDatabase();

    const skipAmount = (Number(page) - 1) * limit;

    const images = await populateUser(Image.find({ author: userId }))
      .sort({ updatedAt: -1 })
      .skip(skipAmount)
      .limit(limit);

    const totalImages = await Image.find({ author: userId }).countDocuments();

    return {
      data: JSON.parse(JSON.stringify(images)),
      totalPages: Math.ceil(totalImages / limit),
    };
  } catch (error) {
    handleError(error);
  }
}
