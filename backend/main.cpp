#include "httplib.h"
#include <iostream>

using namespace httplib;

int main() {
    // HTTP 서버 인스턴스 생성
    Server svr;

    // 기본 GET 엔드포인트 (연결 테스트용)
    svr.Get("/", [](const Request& req, Response& res) {
        res.set_content("Welcome to Together Backend API (C++)", "text/plain");
    });

    // 오답 분석 데이터 수신을 위한 POST 엔드포인트 예시
    svr.Post("/api/analyze", [](const Request& req, Response& res) {
        // 클라이언트로부터 받은 데이터 (JSON 포맷 예상)
        auto body = req.body;
        std::cout << "Received data for analysis: " << body << std::endl;

        // TODO: AI 분석 서버(Python)로 HTTP 요청을 보내서 결과를 받아오기 (Proxy 역할)
        // TODO: 받은 결과를 클라이언트에 반환하기

        res.set_content(R"({"status": "success", "message": "Data received by C++ server"})", "application/json");
    });

    std::cout << "Starting C++ Backend Server on port 8080..." << std::endl;
    std::cout << "http://localhost:8080" << std::endl;
    
    // 8080 포트에서 서버 실행 (동기 블로킹 호출)
    svr.listen("0.0.0.0", 8080);

    return 0;
}
