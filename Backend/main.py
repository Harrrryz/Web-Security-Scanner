import asyncio
import subprocess
import re
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from zapv2 import ZAPv2
from dotenv import load_dotenv
import os
import time
from fastapi.middleware.cors import CORSMiddleware


load_dotenv('env', override=True)
API_KEY = os.environ.get('ZAP_API_KEY')

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
zap = ZAPv2(apikey=API_KEY)


class ScanSqlMapRequest(BaseModel):
    type: str
    title: str
    payload: str


@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.post("/spider-scan")
def read_item(target: str):
    print('Spidering target {}'.format(target))
    # The scan returns a scan id to support concurrent scanning
    scanID = zap.spider.scan(target)
    while int(zap.spider.status(scanID)) < 100:
        # Poll the status until it completes
        print('Spider progress %: {}'.format(zap.spider.status(scanID)))
        time.sleep(1)

    print('Spider has completed!')
    # Prints the URLs the spider has crawled
    return '\n'.join(map(str, zap.spider.results(scanID)))


@app.post("/scan")
def scan(target: str):
    print('Ajax Spider target {}'.format(target))
    scanID = zap.ajaxSpider.scan(target)

    timeout = time.time() + 60*2   # 2 minutes from now
    # Loop until the ajax spider has finished or the timeout has exceeded
    while zap.ajaxSpider.status == 'running':
        if time.time() > timeout:
            break
        print('Ajax Spider status' + zap.ajaxSpider.status)
        time.sleep(2)

    print('Ajax Spider completed')
    ajaxResults = zap.ajaxSpider.results(start=0, count=10)

    print('Active Scanning target {}'.format(target))
    scanID = zap.ascan.scan(target)
    # while int(zap.ascan.status(scanID)) < 100:
    #     # Loop until the scanner has finished
    #     print('Scan progress %: {}'.format(zap.ascan.status(scanID)))
    #     time.sleep(5)

    print('Active Scan completed')
    # Print vulnerabilities found by the scanning
    print('Hosts: {}'.format(', '.join(zap.core.hosts)))
    print('Alerts: ')
    return zap.core.alerts(baseurl=target)


async def scan_stream(target: str):
    yield 'event: spiderUpdate\ndata: Spidering target {}\n\n'.format(target)
    scanID = zap.spider.scan(target)
    while int(zap.spider.status(scanID)) < 100:
        # Poll the status until it completes
        yield 'event: spiderProgress\ndata: Spider progress %: {}\n\n'.format(zap.spider.status(scanID))
        print('Spider progress %: {}'.format(zap.spider.status(scanID)))
        await asyncio.sleep(1)

    yield 'event: spiderComplete\ndata: Spider has completed!\n\n'
    yield 'event: spiderResults\ndata: Spider results: {}\n\n'.format('\n'.join(map(str, zap.spider.results(scanID))))


@app.post("/spider-scan-stream")
async def spider_scan_stream(target: str):
    return StreamingResponse(scan_stream(target), media_type="text/event-stream")


@app.post("/sqlmap")
def sqlmap(target: str):
    print('Running SQLMap on target {}'.format(target))
    # Prints the URLs the spider has crawled

    result = subprocess.run(['python', '../sqlmapproject-sqlmap/sqlmap.py', '-u', target,
                            '--current-db', '--current-user', '--banner', '--batch'], capture_output=True, text=True)
    result1 = result.stdout
    results = result1.split('---')
    param1 = results[1].split('\n\n')
    scan_results: list[ScanSqlMapRequest] = []
    for i in range(len(param1)):
        print(param1[i])

        result = re.findall(
            r'Type:\s(.+?)\n\s*Title:\s(.+?)\n\s*Payload:\s(.+?)\n', param1[i] + '\n')
        if len(result) == 0:
            raise ValueError(
                'No result found. Please check the target URL or the SQLMap command.')
        _type, title, payload = result[0]
        scan_result = ScanSqlMapRequest(
            type=_type, title=title, payload=payload)
        scan_results.append(scan_result)
    return [scan_result.model_dump() for scan_result in scan_results]
