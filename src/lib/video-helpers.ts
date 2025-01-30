import LibAV from "libav.js";

export async function demuxVideoWithLibav(url: string) {
    // 1) Fetch file
    const fileName = url.split("/").pop()?.replace(/\?.*$/, "") ?? "video.mp4";
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Failed to fetch ${url}`);
    const buf = await resp.arrayBuffer();

    // 2) Initialize LibAV
    //    Using "LibAV({})" if your version doesn't need "LibAV.LibAV()"
    const libav = await LibAV.LibAV({});

    // Write the file into libav's in-memory FS
    await libav.writeFile(fileName, new Uint8Array(buf));

    // 3) Open demuxer (use filename in the VFS)
    const [fmt_ctx, streams] = await libav.ff_init_demuxer_file(fileName);

    // (Optional but recommended) Gather stream info
    // so extradata is more likely to be populated.
    await libav.avformat_find_stream_info(fmt_ctx, 0);

    // 4) Find the video stream index
    let videoStreamIndex = -1;
    for (let i = 0; i < streams.length; i++) {
        if (streams[i].codec_type === libav.AVMEDIA_TYPE_VIDEO) {
            videoStreamIndex = i;
            break;
        }
    }
    if (videoStreamIndex < 0) {
        throw new Error("No video track found");
    }

    // 5) Identify codec
    const videoStream = streams[videoStreamIndex];
    const codecName = await libav.avcodec_get_name(videoStream.codec_id);

    // 6) Extract extradata from the video stream
    const streamPtr = videoStream.ptr;
    const codecpar = await libav.avcodec_parameters_alloc();
    await libav.avcodec_parameters_copy(
        codecpar,
        await libav.AVStream_codecpar(streamPtr)
    );

    const extradataPtr = await libav.AVCodecParameters_extradata(codecpar);
    const extradataSize = await libav.AVCodecParameters_extradata_size(codecpar);

    let extradata: Uint8Array | null = null;
    if (extradataPtr && extradataSize > 0) {
        extradata = await libav.copyout_u8(extradataPtr, extradataSize);
    }

    await libav.avcodec_parameters_free(codecpar);

    // 7) Read packets in a loop
    const packets: Array<{
        data: Uint8Array;
        pts: number;
        dts: number;
        isKey: boolean;
    }> = [];

    const pkt = await libav.av_packet_alloc();
    while (true) {
        const ret = await libav.av_read_frame(fmt_ctx, pkt);
        if (ret < 0) {
            // < 0 => EOF or error
            break;
        }

        const streamIndex = await libav.AVPacket_stream_index(pkt);
        if (streamIndex === videoStreamIndex) {
            const size = await libav.AVPacket_size(pkt);
            const dataPtr = await libav.AVPacket_data(pkt);

            // Copy packet bytes to JS
            const packetData = await libav.copyout_u8(dataPtr, size);

            const dts = await libav.AVPacket_dts(pkt);
            const pts = await libav.AVPacket_pts(pkt);

            const flags = await libav.AVPacket_flags(pkt);
            const isKey = (flags & libav.AV_PKT_FLAG_KEY) !== 0;

            packets.push({ data: packetData, pts, dts, isKey });
        }
        await libav.av_packet_unref(pkt);
    }

    // 8) Cleanup
    await libav.av_packet_free(pkt);
    // Pass [fmt_ctx] array for pointer-to-pointer
    await libav.avformat_close_input_js(fmt_ctx);

    // Sort packets by PTS in ascending order
    packets.sort((a, b) => a.pts - b.pts);

    return { packets, extradata, codecName };
}