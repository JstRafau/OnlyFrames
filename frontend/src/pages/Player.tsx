//import { useState } from "react";
import { useParams } from "react-router";
import VideoPlayer from "../Components/VideoPlayer";

export default function Player() {
    let video: string|undefined = useParams().videoGuid;
    return (
        <div>
            {video && <VideoPlayer videoId={video} />}
        </div>
    );
}
 
