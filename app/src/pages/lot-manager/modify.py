import os

file_path = "GarageArrivalConditionPage.jsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("PreRideConditionPage", "GarageArrivalConditionPage")

content = content.replace(
    "const [interiorFile, setInteriorFile] = useState(null);",
    """const [frontFile, setFrontFile] = useState(null);
  const [rearFile, setRearFile] = useState(null);
  const [leftSideFile, setLeftSideFile] = useState(null);
  const [rightSideFile, setRightSideFile] = useState(null);
  const [interiorFile, setInteriorFile] = useState(null);"""
)

content = content.replace(
    "getFile(`interior-${id}`).then(f => f && setInteriorFile(f));",
    """getFile(`front-${id}`).then(f => f && setFrontFile(f));
    getFile(`rear-${id}`).then(f => f && setRearFile(f));
    getFile(`left-${id}`).then(f => f && setLeftSideFile(f));
    getFile(`right-${id}`).then(f => f && setRightSideFile(f));
    getFile(`interior-${id}`).then(f => f && setInteriorFile(f));"""
)

content = content.replace(
    """useEffect(() => {
    if (interiorFile) saveFile(`interior-${id}`, interiorFile);
  }, [interiorFile, id]);""",
    """useEffect(() => {
    if (frontFile) saveFile(`front-${id}`, frontFile);
  }, [frontFile, id]);

  useEffect(() => {
    if (rearFile) saveFile(`rear-${id}`, rearFile);
  }, [rearFile, id]);

  useEffect(() => {
    if (leftSideFile) saveFile(`left-${id}`, leftSideFile);
  }, [leftSideFile, id]);

  useEffect(() => {
    if (rightSideFile) saveFile(`right-${id}`, rightSideFile);
  }, [rightSideFile, id]);

  useEffect(() => {
    if (interiorFile) saveFile(`interior-${id}`, interiorFile);
  }, [interiorFile, id]);"""
)

content = content.replace(
    "if (!interiorFile || !odometerFile) {",
    "if (!frontFile || !rearFile || !leftSideFile || !rightSideFile || !interiorFile || !odometerFile) {"
)

content = content.replace(
    "toast.error('Please upload both Interior and Odometer photos.');",
    "toast.error('Please upload all 6 arrival photos.');"
)

content = content.replace(
    """const [interiorUrl, odometerUrl] = await Promise.all([
        uploadFile(interiorFile),
        uploadFile(odometerFile)
      ]);""",
    """const [frontUrl, rearUrl, leftUrl, rightUrl, interiorUrl, odometerUrl] = await Promise.all([
        uploadFile(frontFile),
        uploadFile(rearFile),
        uploadFile(leftSideFile),
        uploadFile(rightSideFile),
        uploadFile(interiorFile),
        uploadFile(odometerFile)
      ]);"""
)

content = content.replace(
    "api/Pickup/manager/pre-ride-condition",
    "api/Pickup/Manager-arrived/lot-submission"
)

content = content.replace(
    """InteriorImageUrl: interiorUrl,
          OdometerImageUrl: odometerUrl,""",
    """FrontImageUrl: frontUrl,
          RearImageUrl: rearUrl,
          LeftSideImageUrl: leftUrl,
          RightSideImageUrl: rightUrl,
          InteriorImageUrl: interiorUrl,
          OdometerImageUrl: odometerUrl,"""
)

content = content.replace(
    "deleteFile(`interior-${id}`);",
    """deleteFile(`front-${id}`);
        deleteFile(`rear-${id}`);
        deleteFile(`left-${id}`);
        deleteFile(`right-${id}`);
        deleteFile(`interior-${id}`);"""
)

content = content.replace(
    "const allUploaded = interiorFile && odometerFile;",
    "const allUploaded = frontFile && rearFile && leftSideFile && rightSideFile && interiorFile && odometerFile;"
)

content = content.replace(
    "Final check before starting transit for Pickup",
    "Arrival condition report for Storing Pickup"
)

content = content.replace(
    "Pre-Ride Condition",
    "Garage Arrival Condition"
)

content = content.replace(
    '<h3 className="font-extrabold text-gray-900 text-xl">Interior & Odometer</h3>',
    '<h3 className="font-extrabold text-gray-900 text-xl">Arrival Photos</h3>'
)

content = content.replace(
    "{[interiorFile, odometerFile].filter(Boolean).length} / 2 photos",
    "{[frontFile, rearFile, leftSideFile, rightSideFile, interiorFile, odometerFile].filter(Boolean).length} / 6 photos"
)

content = content.replace(
    '<FileSlot label="Interior Photo" icon={Camera} file={interiorFile} onFile={setInteriorFile} onPreview={setPreviewImage} />',
    """<FileSlot label="Front Photo" icon={Camera} file={frontFile} onFile={setFrontFile} onPreview={setPreviewImage} />
            <FileSlot label="Rear Photo" icon={Camera} file={rearFile} onFile={setRearFile} onPreview={setPreviewImage} />
            <FileSlot label="Left Side" icon={Camera} file={leftSideFile} onFile={setLeftSideFile} onPreview={setPreviewImage} />
            <FileSlot label="Right Side" icon={Camera} file={rightSideFile} onFile={setRightSideFile} onPreview={setPreviewImage} />
            <FileSlot label="Interior Photo" icon={Camera} file={interiorFile} onFile={setInteriorFile} onPreview={setPreviewImage} />"""
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
